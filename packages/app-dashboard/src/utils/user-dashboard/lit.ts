import {
  EthWalletProvider,
  WebAuthnProvider,
  BaseProvider,
  LitRelay,
  StytchAuthFactorOtpProvider,
} from '@lit-protocol/lit-auth-client';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import {
  AUTH_METHOD_SCOPE,
  AUTH_METHOD_TYPE,
  LIT_ABILITY,
  LIT_NETWORK,
  LIT_RPC,
} from '@lit-protocol/constants';
import { AuthMethod, IRelayPKP, SessionSigs, LIT_NETWORKS_KEYS } from '@lit-protocol/types';
import { LitActionResource, LitPKPResource } from '@lit-protocol/auth-helpers';
import { ethers } from 'ethers';
import { getPkpNftContract } from './get-pkp-nft-contract';
import { addPayee } from './addPayee';
import { env } from '@/config/env';

const { VITE_DOMAIN, VITE_ENV, VITE_STYTCH_PROJECT_ID } = env;

export const DOMAIN = VITE_DOMAIN || 'localhost';
export const ORIGIN = VITE_ENV === 'production' ? `https://${DOMAIN}` : `http://${DOMAIN}:3000`;

export const SELECTED_LIT_NETWORK = LIT_NETWORK.Datil as LIT_NETWORKS_KEYS;

export const litNodeClient: LitNodeClient = new LitNodeClient({
  alertWhenUnauthorized: false,
  litNetwork: SELECTED_LIT_NETWORK,
  debug: false,
});

litNodeClient.connect();

const litRelay = new LitRelay({
  relayUrl: LitRelay.getRelayUrl(SELECTED_LIT_NETWORK),
  relayApiKey: 'test-api-key',
});

/**
 * Setting all available providers
 */
let ethWalletProvider: EthWalletProvider;
let webAuthnProvider: WebAuthnProvider;
let stytchEmailOtpProvider: StytchAuthFactorOtpProvider<'email'>;
let stytchSmsOtpProvider: StytchAuthFactorOtpProvider<'sms'>;

/**
 * Get the provider that is authenticated with the given auth method
 */
function getAuthenticatedProvider(authMethod: AuthMethod): BaseProvider {
  switch (authMethod.authMethodType) {
    case AUTH_METHOD_TYPE.EthWallet:
      return getEthWalletProvider();
    case AUTH_METHOD_TYPE.WebAuthn:
      return getWebAuthnProvider();
    case AUTH_METHOD_TYPE.StytchEmailFactorOtp:
      return getStytchEmailOtpProvider();
    case AUTH_METHOD_TYPE.StytchSmsFactorOtp:
      return getStytchSmsOtpProvider();
    default:
      throw new Error(`No provider found for auth method type: ${authMethod.authMethodType}`);
  }
}

export function getEthWalletProvider() {
  if (!ethWalletProvider) {
    ethWalletProvider = new EthWalletProvider({
      relay: litRelay,
      litNodeClient,
      domain: DOMAIN,
      origin: ORIGIN,
    });
  }

  return ethWalletProvider;
}

function getWebAuthnProvider() {
  if (!webAuthnProvider) {
    webAuthnProvider = new WebAuthnProvider({
      relay: litRelay,
      litNodeClient,
    });
  }

  return webAuthnProvider;
}
function getStytchEmailOtpProvider() {
  if (!stytchEmailOtpProvider) {
    stytchEmailOtpProvider = new StytchAuthFactorOtpProvider<'email'>(
      {
        relay: litRelay,
        litNodeClient,
      },
      { appId: VITE_STYTCH_PROJECT_ID },
      'email',
    );
  }

  return stytchEmailOtpProvider;
}
function getStytchSmsOtpProvider() {
  if (!stytchSmsOtpProvider) {
    stytchSmsOtpProvider = new StytchAuthFactorOtpProvider<'sms'>(
      {
        relay: litRelay,
        litNodeClient,
      },
      { appId: VITE_STYTCH_PROJECT_ID },
      'sms',
    );
  }

  return stytchSmsOtpProvider;
}

/**
 * Get auth method object by signing a message with an Ethereum wallet
 */
export async function authenticateWithEthWallet(
  address?: string,
  signMessage?: (message: string) => Promise<string>,
): Promise<AuthMethod> {
  const ethWalletProvider = getEthWalletProvider();
  return await ethWalletProvider.authenticate({
    address,
    signMessage,
  });
}

/**
 * Register new WebAuthn credential
 */
export async function registerWebAuthn(): Promise<IRelayPKP> {
  const webAuthnProvider = getWebAuthnProvider();
  // Register new WebAuthn credential
  const options = await webAuthnProvider.register();

  if (options.user) {
    const displayName =
      prompt('Enter display name for your passkey:', 'Vincent User') || 'Vincent User';
    options.user.displayName = displayName;
    options.user.name = displayName.toLowerCase().replace(/\s+/g, '-');
    // Make sure id exists - use name as id if missing
    if (!options.user.id) {
      options.user.id = options.user.name;
    }
  } else {
    const displayName =
      prompt('Enter display name for your passkey:', 'Vincent User') || 'Vincent User';
    const userName = displayName.toLowerCase().replace(/\s+/g, '-');
    options.user = {
      displayName: displayName,
      name: userName,
      id: userName,
    };
  }

  // Verify registration and mint PKP through relay server
  const userTxHash = await webAuthnProvider.verifyAndMintPKPThroughRelayer(options);
  const userResponse = await webAuthnProvider.relay.pollRequestUntilTerminalState(userTxHash);
  if (
    userResponse.status !== 'Succeeded' ||
    !userResponse.pkpTokenId ||
    !userResponse.pkpPublicKey ||
    !userResponse.pkpEthAddress
  ) {
    throw new Error('Minting failed: Invalid response data');
  }
  const newUserPKP: IRelayPKP = {
    tokenId: userResponse.pkpTokenId,
    publicKey: userResponse.pkpPublicKey,
    ethAddress: userResponse.pkpEthAddress,
  };

  try {
    await addPayee(newUserPKP.ethAddress);
  } catch (err) {
    console.warn('Failed to add payee', err);
  }

  // Mint a new PKP to be controlled by the new user PKP
  // We'll still mint this, but we won't return it
  await mintPKPToExistingPKP(newUserPKP);

  return newUserPKP;
}

/**
 * Get auth method object by authenticating with a WebAuthn credential
 */
export async function authenticateWithWebAuthn(): Promise<AuthMethod> {
  const webAuthnProvider = getWebAuthnProvider();
  return await webAuthnProvider.authenticate();
}

/**
 * Get auth method object by validating Stytch JWT
 */
export async function authenticateWithStytch(
  accessToken: string,
  userId?: string,
  method?: 'email' | 'sms',
): Promise<AuthMethod> {
  const provider = method === 'email' ? getStytchEmailOtpProvider() : getStytchSmsOtpProvider();
  if (!provider) {
    throw new Error('Failed to initialize Stytch provider');
  }
  return await provider.authenticate({ accessToken, userId });
}

/**
 * Generate session sigs for given params
 */
export async function getSessionSigs({
  pkpPublicKey,
  authMethod,
}: {
  pkpPublicKey: string;
  authMethod: AuthMethod;
}): Promise<SessionSigs> {
  await litNodeClient.connect();

  const sessionSigs = await litNodeClient.getPkpSessionSigs({
    chain: 'ethereum',
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 1 day
    pkpPublicKey,
    authMethods: [authMethod],
    resourceAbilityRequests: [
      {
        resource: new LitActionResource('*'),
        ability: LIT_ABILITY.LitActionExecution,
      },
      {
        resource: new LitPKPResource('*'),
        ability: LIT_ABILITY.PKPSigning,
      },
    ],
  });

  return sessionSigs;
}

/**
 * Fetch PKPs associated with given auth method, minting one if none exist
 */
export async function getOrMintPKPs(authMethod: AuthMethod): Promise<IRelayPKP[]> {
  const provider = getAuthenticatedProvider(authMethod);
  let allPKPs = await provider.fetchPKPsThroughRelayer(authMethod);
  if (allPKPs.length === 0 && authMethod.authMethodType !== AUTH_METHOD_TYPE.WebAuthn) {
    const newPKP = await mintPKP(authMethod);
    await mintPKPToExistingPKP(newPKP);
    allPKPs = await provider.fetchPKPsThroughRelayer(authMethod);
  }

  return allPKPs;
}

/**
 * Mint a new PKP for current auth method
 */
export async function mintPKP(authMethod: AuthMethod): Promise<IRelayPKP> {
  const provider = getAuthenticatedProvider(authMethod);
  // Set scope of signing any data
  const options = {
    permittedAuthMethodScopes: [[AUTH_METHOD_SCOPE.SignAnything]],
  };

  // Mint PKP through relay server
  const txHash = await provider.mintPKPThroughRelayer(authMethod, options);

  let attempts = 3;
  let response = null;

  while (attempts > 0) {
    try {
      const tempResponse = await provider.relay.pollRequestUntilTerminalState(txHash);
      if (
        tempResponse.status === 'Succeeded' &&
        tempResponse.pkpTokenId &&
        tempResponse.pkpPublicKey &&
        tempResponse.pkpEthAddress
      ) {
        response = {
          status: tempResponse.status,
          pkpTokenId: tempResponse.pkpTokenId,
          pkpPublicKey: tempResponse.pkpPublicKey,
          pkpEthAddress: tempResponse.pkpEthAddress,
        };
        break;
      }
      throw new Error('Invalid response data');
    } catch (err) {
      console.warn('Minting failed, retrying...', err);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts--;
      if (attempts === 0) {
        throw new Error('Minting failed after all attempts');
      }
    }
  }

  if (!response) {
    throw new Error('Minting failed');
  }

  const newPKP: IRelayPKP = {
    tokenId: response.pkpTokenId,
    publicKey: response.pkpPublicKey,
    ethAddress: response.pkpEthAddress,
  };

  try {
    await addPayee(newPKP.ethAddress);
  } catch (err) {
    console.warn('Failed to add payee', err);
  }

  return newPKP;
}

/**
 * Mint a PKP to be controlled by an existing PKP
 */
export async function mintPKPToExistingPKP(pkp: IRelayPKP): Promise<IRelayPKP> {
  const requestBody = {
    keyType: '2',
    permittedAuthMethodTypes: ['2'],
    permittedAuthMethodIds: [pkp.tokenId],
    permittedAuthMethodPubkeys: ['0x'],
    permittedAuthMethodScopes: [['1']],
    addPkpEthAddressAsPermittedAddress: true,
    sendPkpToItself: false,
    burnPkp: false,
    sendToAddressAfterMinting: pkp.ethAddress,
  };

  const agentMintResponse = await fetch(
    'https://datil-relayer.getlit.dev/mint-next-and-add-auth-methods',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': 'test-api-key',
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!agentMintResponse.ok) {
    throw new Error('Failed to mint PKP to existing PKP');
  }

  const agentMintResponseJson = await agentMintResponse.json();

  // Wait for transaction and verify
  const provider = new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);
  const txReceipt = await provider.waitForTransaction(agentMintResponseJson.requestId);

  if (txReceipt.status !== 1) {
    throw new Error('Transaction failed');
  }

  // Get the token ID from the transaction logs
  const pkpNft = getPkpNftContract(SELECTED_LIT_NETWORK);
  const mintEvent = txReceipt.logs.find((log) => {
    try {
      return pkpNft.interface.parseLog(log).name === 'PKPMinted';
    } catch {
      return false;
    }
  });

  if (!mintEvent) {
    throw new Error('Failed to find PKPMinted event in transaction logs');
  }

  const tokenId = pkpNft.interface.parseLog(mintEvent).args.tokenId;
  if (!tokenId) {
    throw new Error('Token ID not found in mint event');
  }

  // Get the public key and eth address from the PKP NFT contract
  const publicKey = await pkpNft.getPubkey(tokenId);
  const ethAddress = ethers.utils.computeAddress(publicKey);

  const agentPKP: IRelayPKP = {
    tokenId: tokenId.toString(),
    publicKey,
    ethAddress,
  };

  return agentPKP;
}
