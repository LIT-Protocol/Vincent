import { GelatoRelay } from '@gelatonetwork/relay-sdk';
import { ERC2771Type } from '@gelatonetwork/relay-sdk/dist/lib/erc2771/types/index.js';
import bs58 from 'bs58';
import { ethers, providers } from 'ethers';

import { AUTH_METHOD_SCOPE, AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import { datil as datilContracts } from '@lit-protocol/contracts';
import {
  COMBINED_ABI,
  deriveAgentAddress,
  VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
} from '@lit-protocol/vincent-contracts-sdk';

import PKPHelperV2Abi from '../../contracts/datil/PKPHelperV2.json';
import { env } from '../env';
import {
  getVincentRegistryChainId,
  getVincentRegistryPublicClient,
  getSmartAccountPublicClient,
} from './chainConfig';
import { getContractClient } from './contractClient';
import { getAppInstallTypedDataToSign } from './getAppInstallTypedData';
import { getSessionKeyApprovalTypedData } from './getSessionKeyApprovalTypedData';
import { App } from './mongo/app';

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
    burnPkp: false,
    sendToAddressAfterMinting: '0x0000000000000000000000000000000000000001',
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

export async function installApp(request: {
  appId: number;
  userControllerAddress: string;
  sponsorGas?: boolean;
}) {
  const { appId, userControllerAddress, sponsorGas = true } = request;

  console.log('[installApp] Installing app:', { appId, userControllerAddress });

  // 1. look up the app and its active version from MongoDB
  const app = await App.findOne({ appId, isDeleted: false });
  if (!app) {
    throw new Error(`App with id ${appId} not found`);
  }
  if (app.activeVersion === undefined || app.activeVersion === null) {
    throw new Error(`App ${appId} has no active version`);
  }

  // 2. Calculate smart account address from user controller and appId
  // Use smart account chain since the smart account will be deployed there
  const vincentRegistryPublicClient = getVincentRegistryPublicClient();
  const smartAccountPublicClient = getSmartAccountPublicClient();
  const agentSmartAccountAddress = await deriveAgentAddress(
    smartAccountPublicClient,
    userControllerAddress,
    appId,
  );

  // 3. Check if user already has a permitted app for this appId
  // If so, return existing PKP and smart account instead of minting a new PKP
  const contractClient = getContractClient();
  const agentAddresses = await contractClient.getAllRegisteredAgentAddressesForUser({
    userAddress: userControllerAddress,
    offset: '0',
  });

  if (agentAddresses.length > 0) {
    const permittedApps = await contractClient.getPermittedAppForAgents({
      agentAddresses,
    });

    const existingAgent = permittedApps.find(
      (agent) => agent.permittedApp && agent.permittedApp.appId === appId,
    );

    if (existingAgent && existingAgent.permittedApp) {
      // 3.1 Check if the permitted version is the same as the active version
      if (existingAgent.permittedApp.version === app.activeVersion) {
        console.log('[installApp] Agent already has this app permitted, returning existing data');
        console.log(`[installApp] Agent Address: ${existingAgent.agentAddress}`);
        console.log(`[installApp] PKP Signer Address: ${existingAgent.permittedApp.pkpSigner}`);
        console.log(`[installApp] Permitted Version: ${existingAgent.permittedApp.version}`);
        console.log(`[installApp] Active Version: ${app.activeVersion}`);
        return {
          agentSignerAddress: existingAgent.permittedApp.pkpSigner,
          agentSmartAccountAddress: existingAgent.agentAddress,
          alreadyInstalled: true,
        };
      }

      console.log(
        `[installApp] Agent has already permitted this app, but the permitted version is different from the active version. Minting new PKP and permitting new version`,
      );
      console.log(`[installApp] Agent Address: ${existingAgent.agentAddress}`);
      console.log(`[installApp] Permitted Version: ${existingAgent.permittedApp.version}`);
      console.log(`[installApp] Active Version: ${app.activeVersion}`);
      // Fall through to fresh install flow below which will mint a new PKP
    }
  }

  // 4. Check if user has a previously uninstalled app (needs reinstall instead of fresh install)
  const unpermittedApps = await contractClient.getUnpermittedAppForAgents({
    agentAddresses: [agentSmartAccountAddress],
  });
  const unpermittedApp = unpermittedApps[0]?.unpermittedApp;

  if (unpermittedApp) {
    console.log(
      '[installApp] Agent has an unpermitted this app, repermitting it with existing PKP',
    );
    console.log(
      '[installApp] Agent Address:',
      agentSmartAccountAddress,
      'Unpermitted App:',
      unpermittedApp.appId,
      'Previous Permitted Version:',
      unpermittedApp.previousPermittedVersion,
      'Active Version:',
      app.activeVersion,
    );
    const txData = COMBINED_ABI.encodeFunctionData('rePermitApp', [
      agentSmartAccountAddress,
      appId,
    ]);

    // 4.5 If sponsorGas is false, return raw transaction for direct EOA submission
    if (!sponsorGas) {
      return {
        agentSignerAddress: unpermittedApp.pkpSigner,
        agentSmartAccountAddress,
        rawTransaction: {
          to: VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
          data: txData,
        },
      };
    }

    const dataToSign = await relaySdk.getDataToSignERC2771(
      {
        chainId: getVincentRegistryChainId() as unknown as bigint,
        target: VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
        data: txData,
        user: userControllerAddress,
        isConcurrent: true,
      },
      ERC2771Type.ConcurrentSponsoredCall,
      vincentRegistryPublicClient as unknown as Parameters<typeof relaySdk.getDataToSignERC2771>[2],
    );

    return {
      agentSignerAddress: unpermittedApp.pkpSigner,
      agentSmartAccountAddress,
      appInstallationDataToSign: dataToSign,
    };
  }

  // 5. Fresh install flow - Fetch abilities for this app version directly from on-chain contract
  const appVersionResult = await contractClient.getAppVersion({
    appId,
    version: app.activeVersion,
  });

  if (!appVersionResult) {
    throw new Error(`App version ${app.activeVersion} not found on-chain for app ${appId}`);
  }

  // 6. Extract IPFS CIDs from on-chain abilities
  const abilityIpfsCids = appVersionResult.appVersion.abilities.map(
    (ability) => ability.abilityIpfsCid,
  );

  console.log('[installApp] Found abilities:', { count: abilityIpfsCids.length, abilityIpfsCids });

  // 7. Build auth methods from ability IPFS CIDs
  const permittedAuthMethodTypes = abilityIpfsCids.map(() => AUTH_METHOD_TYPE.LitAction);
  const permittedAuthMethodIds = abilityIpfsCids.map((cid) => base58ToHex(cid));
  const permittedAuthMethodPubkeys = abilityIpfsCids.map(() => '0x');
  const permittedAuthMethodScopes = abilityIpfsCids.map(() => [AUTH_METHOD_SCOPE.SignAnything]);

  // 8. Mint the PKP (will be burned)
  const mintTx = await mintPkpWithAuthMethods({
    types: permittedAuthMethodTypes,
    ids: permittedAuthMethodIds,
    pubkeys: permittedAuthMethodPubkeys,
    scopes: permittedAuthMethodScopes,
  });
  console.log(`[installApp] Mint tx submitted: ${mintTx.hash}`);

  // 9. Wait for mint confirmation and extract PKP
  const signer = getTransactionSigner();
  const provider = signer.provider;
  if (!provider || !mintTx.hash) {
    throw new Error('Missing provider or transaction hash');
  }
  const mintReceipt = await provider.waitForTransaction(mintTx.hash);
  const pkp = extractPkpFromMintReceipt(mintReceipt, signer);

  console.log(`[installApp] PKP minted: ${pkp.ethAddress}`);

  console.log(
    `[installApp] Complete. App ${appId} v${app.activeVersion}, PKP: ${pkp.ethAddress}, SmartAccount: ${agentSmartAccountAddress}`,
  );

  // 10. Build EIP2771 data for user to sign (permitAppVersion on Vincent contract)
  // pkpSignerPubKey is the raw public key bytes (contract expects bytes calldata)
  const pkpSignerPubKey = pkp.publicKey;

  // For installation, users don't set policies - create empty arrays matching ability count
  const policyIpfsCids: string[][] = abilityIpfsCids.map(() => []);
  const policyParameterValues: string[][] = abilityIpfsCids.map(() => []);

  console.log('[installApp] Encoding permitAppVersion call...');

  const txData = COMBINED_ABI.encodeFunctionData('permitAppVersion', [
    agentSmartAccountAddress,
    pkp.ethAddress,
    pkpSignerPubKey,
    appId,
    app.activeVersion,
    abilityIpfsCids,
    policyIpfsCids,
    policyParameterValues,
  ]);

  // If sponsorGas is false, return raw transaction for direct EOA submission
  if (!sponsorGas) {
    console.log('[installApp] Returning raw transaction for direct submission');
    return {
      agentSignerAddress: pkp.ethAddress,
      agentSmartAccountAddress,
      rawTransaction: {
        to: VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
        data: txData,
      },
    };
  }

  console.log('[installApp] Getting EIP2771 data to sign...');

  const dataToSign = await relaySdk.getDataToSignERC2771(
    {
      chainId: getVincentRegistryChainId() as unknown as bigint,
      target: VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
      data: txData,
      user: userControllerAddress,
      isConcurrent: true,
    },
    ERC2771Type.ConcurrentSponsoredCall,
    vincentRegistryPublicClient as unknown as Parameters<typeof relaySdk.getDataToSignERC2771>[2],
  );
  console.log('[installApp] Data to sign Vincent registry app permission obtained successfully');

  const agentSmartAccountDeploymentDataToSign = await getAppInstallTypedDataToSign({
    userControllerAddress: userControllerAddress as `0x${string}`,
    appId,
  });
  console.log('[installApp] Data to sign smart account deployment obtained successfully');

  const sessionKeyApprovalDataToSign = await getSessionKeyApprovalTypedData({
    userControllerAddress: userControllerAddress as `0x${string}`,
    agentSignerAddress: pkp.ethAddress as `0x${string}`,
    appId,
  });
  console.log('[installApp] Data to sign session key approval obtained successfully');

  return {
    agentSignerAddress: pkp.ethAddress,
    agentSmartAccountAddress,
    appInstallationDataToSign: dataToSign,
    agentSmartAccountDeploymentDataToSign,
    sessionKeyApprovalDataToSign,
  };
}
