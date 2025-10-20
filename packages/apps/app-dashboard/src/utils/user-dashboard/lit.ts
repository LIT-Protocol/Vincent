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
} from '@lit-protocol/constants';
import { AuthMethod, IRelayPKP, SessionSigs, LIT_NETWORKS_KEYS } from '@lit-protocol/types';
import { LitActionResource, LitPKPResource } from '@lit-protocol/auth-helpers';
import { ethers } from 'ethers';
import * as Sentry from '@sentry/react';
import { getPkpNftContract } from './get-pkp-nft-contract';
import { addPayee } from './addPayee';
import { env } from '@/config/env';

const { VITE_ENV, VITE_STYTCH_PROJECT_ID, VITE_VINCENT_YELLOWSTONE_RPC } = env;

export const DOMAIN = VITE_ENV === 'staging' ? 'localhost:5173' : 'dashboard.heyvincent.ai';
export const ORIGIN = VITE_ENV === 'staging' ? `http://${DOMAIN}` : `https://${DOMAIN}`;

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
export async function registerWebAuthn(displayName: string): Promise<IRelayPKP> {
  const webAuthnProvider = getWebAuthnProvider();
  // Register new WebAuthn credential
  const options = await webAuthnProvider.register();

  const passkeyName = displayName;

  if (options.user) {
    options.user.displayName = passkeyName;
    options.user.name = passkeyName.toLowerCase().replace(/\s+/g, '-');
    // Make sure id exists - use name as id if missing
    if (!options.user.id) {
      options.user.id = options.user.name;
    }
  } else {
    const userName = passkeyName.toLowerCase().replace(/\s+/g, '-');
    options.user = {
      displayName: passkeyName,
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
    const error = new Error('Minting failed: Invalid response data');
    Sentry.addBreadcrumb({
      category: 'auth.webauthn',
      message: 'WebAuthn PKP minting failed',
      level: 'error',
      data: {
        responseStatus: userResponse.status,
        hasPkpTokenId: !!userResponse.pkpTokenId,
        hasPkpPublicKey: !!userResponse.pkpPublicKey,
        hasPkpEthAddress: !!userResponse.pkpEthAddress,
      },
    });
    throw error;
  }
  const userPKP: IRelayPKP = {
    tokenId: userResponse.pkpTokenId,
    publicKey: userResponse.pkpPublicKey,
    ethAddress: userResponse.pkpEthAddress,
  };

  try {
    await addPayee(userPKP.ethAddress);
  } catch (err) {
    console.warn('Failed to add payee', err);
    Sentry.addBreadcrumb({
      category: 'auth.webauthn',
      message: 'Failed to add payee for new PKP',
      level: 'warning',
      data: {
        pkpEthAddress: userPKP.ethAddress,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }

  return userPKP;
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
    const error = new Error('Failed to initialize Stytch provider');
    Sentry.addBreadcrumb({
      category: 'auth.stytch',
      message: 'Failed to initialize Stytch provider',
      level: 'error',
      data: {
        method,
        userId,
      },
    });
    throw error;
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
export async function getOrMintUserPkp(authMethod: AuthMethod): Promise<IRelayPKP[]> {
  const provider = getAuthenticatedProvider(authMethod);
  let allPKPs = await provider.fetchPKPsThroughRelayer(authMethod);
  if (allPKPs.length === 0 && authMethod.authMethodType !== AUTH_METHOD_TYPE.WebAuthn) {
    await mintPKP(authMethod);
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
      const error = new Error('Invalid response data');
      Sentry.addBreadcrumb({
        category: 'auth.mint',
        message: 'PKP minting poll returned invalid data',
        level: 'error',
        data: {
          attemptsRemaining: attempts,
        },
      });
      throw error;
    } catch (err) {
      console.warn('Minting failed, retrying...', err);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts--;
      if (attempts === 0) {
        Sentry.addBreadcrumb({
          category: 'auth.mint',
          message: 'PKP minting failed after all retry attempts',
          level: 'error',
          data: {
            error: err instanceof Error ? err.message : String(err),
          },
        });
        throw new Error('Minting failed after all attempts');
      }
    }
  }

  if (!response) {
    const error = new Error('Minting failed');
    Sentry.addBreadcrumb({
      category: 'auth.mint',
      message: 'PKP minting completed with no response',
      level: 'error',
    });
    throw error;
  }

  const userPKP: IRelayPKP = {
    tokenId: response.pkpTokenId,
    publicKey: response.pkpPublicKey,
    ethAddress: response.pkpEthAddress,
  };

  try {
    await addPayee(userPKP.ethAddress);
  } catch (err) {
    console.warn('Failed to add payee', err);
    Sentry.addBreadcrumb({
      category: 'auth.mint',
      message: 'Failed to add payee for minted PKP',
      level: 'warning',
      data: {
        pkpEthAddress: userPKP.ethAddress,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }

  return userPKP;
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
    const errorText = await agentMintResponse.text();
    const error = new Error(
      `Failed to mint PKP to existing PKP: ${agentMintResponse.status} ${agentMintResponse.statusText} - ${errorText}`,
    );
    Sentry.addBreadcrumb({
      category: 'auth.mint',
      message: 'Failed to mint agent PKP from parent PKP',
      level: 'error',
      data: {
        status: agentMintResponse.status,
        statusText: agentMintResponse.statusText,
        parentPkpAddress: pkp.ethAddress,
        parentPkpTokenId: pkp.tokenId,
      },
    });
    throw error;
  }

  const agentMintResponseJson = await agentMintResponse.json();

  // Wait for transaction and verify
  const provider = new ethers.providers.JsonRpcProvider(VITE_VINCENT_YELLOWSTONE_RPC);
  const txReceipt = await provider.waitForTransaction(agentMintResponseJson.requestId);

  if (txReceipt.status !== 1) {
    const error = new Error(
      `Transaction failed with status: ${txReceipt.status}. Transaction hash: ${agentMintResponseJson.requestId}`,
    );
    Sentry.addBreadcrumb({
      category: 'auth.mint',
      message: 'Agent PKP minting transaction failed',
      level: 'error',
      data: {
        txStatus: txReceipt.status,
        txHash: agentMintResponseJson.requestId,
        parentPkpAddress: pkp.ethAddress,
      },
    });
    throw error;
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
    const error = new Error(
      `Failed to find PKPMinted event in transaction logs. Found ${txReceipt.logs.length} logs. Transaction hash: ${agentMintResponseJson.requestId}`,
    );
    Sentry.addBreadcrumb({
      category: 'auth.mint',
      message: 'No PKPMinted event found in transaction logs',
      level: 'error',
      data: {
        logsCount: txReceipt.logs.length,
        txHash: agentMintResponseJson.requestId,
        parentPkpAddress: pkp.ethAddress,
      },
    });
    throw error;
  }

  const tokenId = pkpNft.interface.parseLog(mintEvent).args.tokenId;
  if (!tokenId) {
    const error = new Error(
      `Token ID not found in mint event. Transaction hash: ${agentMintResponseJson.requestId}`,
    );
    Sentry.addBreadcrumb({
      category: 'auth.mint',
      message: 'Token ID not found in PKPMinted event',
      level: 'error',
      data: {
        txHash: agentMintResponseJson.requestId,
        parentPkpAddress: pkp.ethAddress,
      },
    });
    throw error;
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
