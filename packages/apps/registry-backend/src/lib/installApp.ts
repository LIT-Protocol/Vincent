import { GelatoRelay } from '@gelatonetwork/relay-sdk';
import { ERC2771Type } from '@gelatonetwork/relay-sdk/dist/lib/erc2771/types/index.js';
import { getKernelAddressFromECDSA } from '@zerodev/ecdsa-validator';
import { constants } from '@zerodev/sdk';
import bs58 from 'bs58';
import { ethers, providers } from 'ethers';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

import { AUTH_METHOD_SCOPE, AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import { datil as datilContracts } from '@lit-protocol/contracts';
import {
  COMBINED_ABI,
  deriveSmartAccountIndex,
  VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
} from '@lit-protocol/vincent-contracts-sdk';

import PKPHelperV2Abi from '../../contracts/datil/PKPHelperV2.json';
import { env } from '../env';
import { AbilityVersion } from './mongo/ability';
import { App, AppAbility } from './mongo/app';

// ============================================================================
// Utilities
// ============================================================================

function base58ToHex(cid: string): string {
  const bytes = bs58.decode(cid);
  return ethers.utils.hexlify(bytes);
}

// ============================================================================
// Configuration
// ============================================================================

const PKP_HELPER_V2_ADDRESS = '0x3f24953B66Ed4089c6B25Be8C7a83262d6f6255C';
const PKP_NFT_ADDRESS = '0x487A9D096BB4B7Ac1520Cb12370e31e677B175EA';

const relaySdk = new GelatoRelay();
const baseSepoliaPublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

function getConfig() {
  return {
    rpcUrl: env.LIT_TXSENDER_RPC_URL,
    privateKey: env.LIT_TXSENDER_PRIVATE_KEY,
    gasLimitMultiplier: env.GAS_LIMIT_INCREASE_PERCENTAGE,
  };
}

// ============================================================================
// Provider & Signer
// ============================================================================

let cachedProvider: providers.JsonRpcProvider | null = null;
let cachedSigner: ethers.Wallet | null = null;

function getRpcProvider(): providers.JsonRpcProvider {
  if (!cachedProvider) {
    const { rpcUrl } = getConfig();
    cachedProvider = new providers.JsonRpcProvider(rpcUrl);
    cachedProvider.pollingInterval = 200;
  }
  return cachedProvider;
}

function getTransactionSigner(): ethers.Wallet {
  if (!cachedSigner) {
    const { privateKey } = getConfig();
    cachedSigner = new ethers.Wallet(privateKey, getRpcProvider());
  }
  return cachedSigner;
}

// ============================================================================
// Contract Access
// ============================================================================

// PKPHelperV2 is not in @lit-protocol/contracts (only v1)
// Use the local ABI instead (matches relayer implementation)
function getPkpHelperV2Contract(signer: ethers.Wallet): ethers.Contract {
  return new ethers.Contract(PKP_HELPER_V2_ADDRESS, PKPHelperV2Abi.abi, signer);
}

function getPkpNftContract(signer: ethers.Wallet): ethers.Contract {
  const pkpNftContract = datilContracts.data.find((c: { name: string }) => c.name === 'PKPNFT');
  if (!pkpNftContract) {
    throw new Error('PKPNFT contract not found in datilContracts');
  }
  return new ethers.Contract(PKP_NFT_ADDRESS, pkpNftContract.contracts[0].ABI, signer);
}

// ============================================================================
// Nonce Management - same as the relayer
// ============================================================================

class NonceManager {
  private static instances = new Map<string, NonceManager>();

  private baseNonce = -1;
  private nextNonce = -1;
  private lastRefreshTime = 0;
  private pendingNonces = new Set<number>();
  private refreshPromise: Promise<void> | null = null;

  private readonly CACHE_TTL_MS = 3000;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  private constructor(_address: string) {}

  static forWallet(walletAddress: string): NonceManager {
    const normalized = walletAddress.toLowerCase();
    let instance = this.instances.get(normalized);
    if (!instance) {
      instance = new NonceManager(normalized);
      this.instances.set(normalized, instance);
    }
    return instance;
  }

  async acquireNonce(wallet: ethers.Wallet): Promise<number> {
    await this.refreshIfStale(wallet);

    const nonce = this.nextNonce;
    this.nextNonce++;
    this.pendingNonces.add(nonce);

    console.log(`[NonceManager] Acquired nonce ${nonce} (${this.pendingNonces.size} pending)`);
    return nonce;
  }

  releaseNonce(nonce: number, success: boolean): void {
    this.pendingNonces.delete(nonce);
    if (!success) {
      console.log(`[NonceManager] Nonce ${nonce} released (failed)`);
    }
  }

  async forceRefresh(wallet: ethers.Wallet): Promise<void> {
    this.lastRefreshTime = 0;
    this.refreshPromise = null;
    await this.refreshIfStale(wallet);
  }

  private async refreshIfStale(wallet: ethers.Wallet): Promise<void> {
    const now = Date.now();
    const isStale = now - this.lastRefreshTime > this.CACHE_TTL_MS;
    const needsInit = this.baseNonce === -1;

    if (!needsInit && !isStale) return;

    if (this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    this.refreshPromise = this.doRefresh(wallet, now);
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefresh(wallet: ethers.Wallet, timestamp: number): Promise<void> {
    try {
      const chainNonce = await wallet.getTransactionCount('pending');

      if (this.baseNonce === -1) {
        this.baseNonce = chainNonce;
        this.nextNonce = chainNonce;
      } else if (chainNonce > this.nextNonce) {
        this.baseNonce = chainNonce;
        this.nextNonce = chainNonce;
      } else if (Math.abs(chainNonce - this.nextNonce) > 10) {
        console.warn(`[NonceManager] Large drift detected, resetting`);
        this.baseNonce = chainNonce;
        this.nextNonce = chainNonce;
      } else {
        this.baseNonce = chainNonce;
      }

      this.lastRefreshTime = timestamp;
    } catch (error) {
      if (this.baseNonce === -1) throw error;
      console.warn(`[NonceManager] RPC error, using cached nonce ${this.nextNonce}`);
    }
  }

  static isRetryableNonceError(errorMessage: string): boolean {
    const patterns = [
      'nonce too low',
      'nonce too high',
      'replacement fee too low',
      'already known',
      'invalid nonce',
      'nonce has already been used',
    ];
    const lower = errorMessage.toLowerCase();
    return patterns.some((p) => lower.includes(p));
  }
}

async function sendTransactionWithRetry(
  wallet: ethers.Wallet,
  buildTransaction: (nonce: number) => Promise<providers.TransactionResponse>,
  maxRetries = 15,
): Promise<providers.TransactionResponse> {
  const nonceManager = NonceManager.forWallet(wallet.address);
  let lastError: Error | null = null;
  let consecutiveNonceErrors = 0;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const nonce = await nonceManager.acquireNonce(wallet);

    try {
      console.log(`[Transaction] Attempt ${attempt + 1}/${maxRetries} with nonce ${nonce}`);
      const tx = await buildTransaction(nonce);
      console.log(`[Transaction] Submitted: ${tx.hash}`);

      // Track confirmation in background
      tx.wait()
        .then(() => nonceManager.releaseNonce(nonce, true))
        .catch(() => nonceManager.releaseNonce(nonce, false));

      return tx;
    } catch (error) {
      const message = (error as Error).message;
      lastError = error as Error;

      console.error(`[Transaction] Attempt ${attempt + 1} failed: ${message}`);

      if (NonceManager.isRetryableNonceError(message)) {
        consecutiveNonceErrors++;
        await nonceManager.forceRefresh(wallet);

        const baseDelay = consecutiveNonceErrors > 3 ? 200 : 50;
        const delay = Math.min(baseDelay * Math.pow(1.5, attempt), 3000);
        const jitter = Math.random() * 0.4;
        await new Promise((r) => setTimeout(r, delay * (1 + jitter)));
        continue;
      }

      throw error;
    }
  }

  throw new Error(`Transaction failed after ${maxRetries} attempts: ${lastError?.message}`);
}

// ============================================================================
// Receipt Utilities
// ============================================================================

function extractPkpFromMintReceipt(receipt: providers.TransactionReceipt, signer: ethers.Wallet) {
  const pkpNft = getPkpNftContract(signer);

  const mintEvent = receipt.logs.find((log) => {
    try {
      return pkpNft.interface.parseLog(log).name === 'PKPMinted';
    } catch {
      return false;
    }
  });

  if (!mintEvent) {
    throw new Error('PKPMinted event not found in transaction receipt');
  }

  const { tokenId, pubkey } = pkpNft.interface.parseLog(mintEvent).args;

  return {
    tokenId: tokenId.toString(),
    publicKey: pubkey,
    ethAddress: ethers.utils.computeAddress(pubkey),
  };
}

// ============================================================================
// PKP Minting
// ============================================================================

async function mintPkpWithAuthMethods(authMethods: {
  types: number[];
  ids: string[];
  pubkeys: string[];
  scopes: number[][];
}): Promise<providers.TransactionResponse> {
  const config = getConfig();
  const signer = getTransactionSigner();
  const pkpNft = getPkpNftContract(signer);
  const pkpHelper = getPkpHelperV2Contract(signer);

  const mintCost = await pkpNft.mintCost();

  const mintParams = {
    keyType: '2',
    permittedAuthMethodTypes: authMethods.types,
    permittedAuthMethodIds: authMethods.ids,
    permittedAuthMethodPubkeys: authMethods.pubkeys,
    permittedAuthMethodScopes: authMethods.scopes,
    addPkpEthAddressAsPermittedAddress: true,
    pkpEthAddressScopes: [],
    sendPkpToItself: false,
    burnPkp: true,
    sendToAddressAfterMinting: ethers.constants.AddressZero,
  };

  // Estimate gas with buffer
  const txData = await pkpHelper.populateTransaction.mintNextAndAddAuthMethods(mintParams, {
    value: mintCost,
  });

  const estimatedGas = await pkpNft.provider.estimateGas(txData);
  const gasLimit = estimatedGas
    .mul(ethers.BigNumber.from(config.gasLimitMultiplier))
    .div(ethers.BigNumber.from(100));

  return sendTransactionWithRetry(signer, async (nonce) => {
    return pkpHelper.mintNextAndAddAuthMethods(mintParams, {
      value: mintCost,
      gasLimit,
      nonce,
    });
  });
}

export async function installApp(request: { appId: number; userControllerAddress: string }) {
  const { appId, userControllerAddress } = request;

  console.log('[installApp] Installing app:', { appId, userControllerAddress });

  // 1. look up the app and its active version
  const app = await App.findOne({ appId, isDeleted: false });
  if (!app) {
    throw new Error(`App with id ${appId} not found`);
  }
  if (app.activeVersion === undefined || app.activeVersion === null) {
    throw new Error(`App ${appId} has no active version`);
  }

  // 2. fetch abilities for this app version
  const appAbilities = await AppAbility.find({
    appId,
    appVersion: app.activeVersion,
    isDeleted: false,
  });

  // 3. look up IPFS CIDs for each ability
  const abilityIpfsCids: string[] = [];
  for (const appAbility of appAbilities) {
    const abilityVersion = await AbilityVersion.findOne({
      packageName: appAbility.abilityPackageName,
      version: appAbility.abilityVersion,
      isDeleted: false,
    });
    if (abilityVersion?.ipfsCid) {
      abilityIpfsCids.push(abilityVersion.ipfsCid);
    }
  }

  console.log('[installApp] Found abilities:', { count: abilityIpfsCids.length, abilityIpfsCids });

  // 4. Build auth methods from ability IPFS CIDs
  const permittedAuthMethodTypes = abilityIpfsCids.map(() => AUTH_METHOD_TYPE.LitAction);
  const permittedAuthMethodIds = abilityIpfsCids.map((cid) => base58ToHex(cid));
  const permittedAuthMethodPubkeys = abilityIpfsCids.map(() => '0x');
  const permittedAuthMethodScopes = abilityIpfsCids.map(() => [AUTH_METHOD_SCOPE.SignAnything]);

  // 5. Mint the PKP (will be burned)
  const mintTx = await mintPkpWithAuthMethods({
    types: permittedAuthMethodTypes,
    ids: permittedAuthMethodIds,
    pubkeys: permittedAuthMethodPubkeys,
    scopes: permittedAuthMethodScopes,
  });
  console.log(`[installApp] Mint tx submitted: ${mintTx.hash}`);

  // 6. Wait for mint confirmation and extract PKP
  const signer = getTransactionSigner();
  const provider = signer.provider;
  if (!provider || !mintTx.hash) {
    throw new Error('Missing provider or transaction hash');
  }
  const mintReceipt = await provider.waitForTransaction(mintTx.hash);
  const pkp = extractPkpFromMintReceipt(mintReceipt, signer);

  console.log(`[installApp] PKP minted: ${pkp.ethAddress}`);

  // 7. Calculate smart account address from PKP address
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const agentSmartAccountAddress = await getKernelAddressFromECDSA({
    publicClient: publicClient as any,
    eoaAddress: userControllerAddress as `0x${string}`,
    index: deriveSmartAccountIndex(appId),
    entryPoint: constants.getEntryPoint('0.7'),
    kernelVersion: constants.KERNEL_V3_1,
  });

  console.log(
    `[installApp] Complete. App ${appId} v${app.activeVersion}, PKP: ${pkp.ethAddress}, SmartAccount: ${agentSmartAccountAddress}`,
  );

  // 8. Build EIP2771 data for user to sign (permitAppVersion on Vincent contract)
  // TODO: this will be pubkey in bytes
  // Use tokenId (keccak256 of pubkey) as it fits in uint256; full pubkey is 65 bytes
  const pkpSignerPubKey = BigInt(pkp.tokenId);

  // For installation, users don't set policies - create empty arrays matching ability count
  const policyIpfsCids: string[][] = abilityIpfsCids.map(() => []);
  const policyParameterValues: string[][] = abilityIpfsCids.map(() => []);

  console.log('[installApp] Encoding permitAppVersion call...');

  // Use ethers Interface to encode the function call (COMBINED_ABI is an ethers Interface)
  const txData = COMBINED_ABI.encodeFunctionData('permitAppVersion', [
    agentSmartAccountAddress, // agentAddress
    pkp.ethAddress, // pkpSigner
    pkpSignerPubKey, // pkpSignerPubKey
    appId, // appId
    app.activeVersion, // appVersion
    abilityIpfsCids, // abilityIpfsCids
    policyIpfsCids, // policyIpfsCids
    policyParameterValues, // policyParameterValues
  ]);

  console.log('[installApp] Getting EIP2771 data to sign...');

  // Types don't match (SDK expects ethers, we pass viem) but works at runtime
  const dataToSign = await relaySdk.getDataToSignERC2771(
    {
      chainId: baseSepolia.id as unknown as bigint,
      target: VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
      data: txData,
      user: userControllerAddress,
      isConcurrent: true,
    },
    ERC2771Type.ConcurrentSponsoredCall,
    baseSepoliaPublicClient as unknown as Parameters<typeof relaySdk.getDataToSignERC2771>[2],
  );

  console.log('[installApp] Data to sign obtained successfully');

  return {
    agentSignerAddress: pkp.ethAddress,
    agentSmartAccountAddress,
    appInstallationDataToSign: dataToSign,
  };
}
