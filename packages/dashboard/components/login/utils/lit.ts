import {
  DiscordProvider,
  GoogleProvider,
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
import {
  AuthMethod,
  GetSessionSigsProps,
  IRelayPKP,
  SessionSigs,
  LIT_NETWORKS_KEYS,
  IRelayPollStatusResponse,
} from '@lit-protocol/types';
import { LitPKPResource } from '@lit-protocol/auth-helpers';

export const DOMAIN = process.env.NEXT_PUBLIC_PUBLIC_DOMAIN || 'localhost';
export const ORIGIN =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? `https://${DOMAIN}`
    : `http://${DOMAIN}:3000` || `http://${DOMAIN}:3001`;

export const SELECTED_LIT_NETWORK = ((process.env.NEXT_PUBLIC_LIT_NETWORK as string) ||
  LIT_NETWORK.DatilDev) as LIT_NETWORKS_KEYS;

export const litNodeClient: LitNodeClient = new LitNodeClient({
  alertWhenUnauthorized: false,
  litNetwork: SELECTED_LIT_NETWORK,
  debug: true,
});

litNodeClient.connect();

const litRelay = new LitRelay({
  relayUrl: LitRelay.getRelayUrl(SELECTED_LIT_NETWORK),
  relayApiKey: 'test-api-key',
});

/**
 * Setting all available providers
 */
let googleProvider: GoogleProvider;
let discordProvider: DiscordProvider;
let ethWalletProvider: EthWalletProvider;
let webAuthnProvider: WebAuthnProvider;
let stytchEmailOtpProvider: StytchAuthFactorOtpProvider<'email'>;
let stytchSmsOtpProvider: StytchAuthFactorOtpProvider<'sms'>;

/**
 * Get the provider that is authenticated with the given auth method
 */
function getAuthenticatedProvider(authMethod: AuthMethod): BaseProvider {
  const providers = {
    [AUTH_METHOD_TYPE.GoogleJwt]: googleProvider,
    [AUTH_METHOD_TYPE.Discord]: discordProvider,
    [AUTH_METHOD_TYPE.EthWallet]: ethWalletProvider,
    [AUTH_METHOD_TYPE.WebAuthn]: webAuthnProvider,
    [AUTH_METHOD_TYPE.StytchEmailFactorOtp]: stytchEmailOtpProvider,
    [AUTH_METHOD_TYPE.StytchSmsFactorOtp]: stytchSmsOtpProvider,
  };

  return providers[authMethod.authMethodType];
}

function getGoogleProvider(redirectUri: string) {
  if (!googleProvider) {
    googleProvider = new GoogleProvider({
      relay: litRelay,
      litNodeClient,
      redirectUri,
    });
  }

  return googleProvider;
}
function getDiscordProvider(redirectUri: string) {
  if (!discordProvider) {
    discordProvider = new DiscordProvider({
      relay: litRelay,
      litNodeClient,
      redirectUri,
    });
  }

  return discordProvider;
}
function getEthWalletProvider() {
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
  if (!process.env.NEXT_PUBLIC_STYTCH_PROJECT_ID) {
    throw new Error('Stytch project ID is not set');
  }
  if (!stytchEmailOtpProvider) {
    stytchEmailOtpProvider = new StytchAuthFactorOtpProvider<'email'>(
      {
        relay: litRelay,
        litNodeClient,
      },
      { appId: process.env.NEXT_PUBLIC_STYTCH_PROJECT_ID},
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
      { appId: process.env.NEXT_PUBLIC_STYTCH_PROJECT_ID || '' },
      'sms',
    );
  }

  return stytchSmsOtpProvider;
}


/**
 * Validate provider
 */
export function isSocialLoginSupported(provider: string): boolean {
  return ['google', 'discord'].includes(provider);
}

/**
 * Redirect to Lit login
 */
export async function signInWithGoogle(redirectUri: string): Promise<void> {
  const googleProvider = getGoogleProvider(redirectUri);
  await googleProvider.signIn();
}

/**
 * Get auth method object from redirect
 */
export async function authenticateWithGoogle(
  redirectUri: string
): Promise<AuthMethod> {
  const googleProvider = getGoogleProvider(redirectUri);
  const authMethod = await googleProvider.authenticate();
  return authMethod;
}

/**
 * Redirect to Lit login
 */
export async function signInWithDiscord(redirectUri: string): Promise<void> {
  const discordProvider = getDiscordProvider(redirectUri);
  await discordProvider.signIn();
}

/**
 * Get auth method object from redirect
 */
export async function authenticateWithDiscord(
  redirectUri: string
): Promise<AuthMethod> {
  const discordProvider = getDiscordProvider(redirectUri);
  const authMethod = await discordProvider.authenticate();
  return authMethod;
}

/**
 * Get auth method object by signing a message with an Ethereum wallet
 */
export async function authenticateWithEthWallet(
  address: string,
  signMessage: (message: string) => Promise<string>
): Promise<AuthMethod> {
  const ethWalletProvider = getEthWalletProvider();
  const authMethod = await ethWalletProvider.authenticate({
    address,
    signMessage,
  });
  return authMethod;
}

/**
 * Register new WebAuthn credential
 */
export async function registerWebAuthn(): Promise<IRelayPKP> {
  const webAuthnProvider = getWebAuthnProvider();
  // Register new WebAuthn credential
  const options = await webAuthnProvider.register();

  if (options.user) {
    options.user.displayName = "Lit Protocol User";
    options.user.name = "apple-12";
  } else {
    options.user = {
      displayName: "Lit Protocol User",
      name: "apple-12",
      id: "apple-12",
    };
  }

  // Verify registration and mint PKP through relay server
  const txHash = await webAuthnProvider.verifyAndMintPKPThroughRelayer(options);
  const response = await webAuthnProvider.relay.pollRequestUntilTerminalState(txHash);
  if (response.status !== 'Succeeded') {
    throw new Error('Minting failed');
  }
  if (!response.pkpTokenId || !response.pkpPublicKey || !response.pkpEthAddress) {
    throw new Error('Minting failed');
  }
  const newPKP: IRelayPKP = {
    tokenId: response.pkpTokenId,
    publicKey: response.pkpPublicKey,
    ethAddress: response.pkpEthAddress,
  };
  return newPKP;
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
  method?: string
): Promise<AuthMethod> {
  const provider = method === 'email' ? getStytchEmailOtpProvider() : getStytchSmsOtpProvider();

  return await provider?.authenticate({ accessToken, userId });
}

/**
 * Generate session sigs for given params
 */
export async function getSessionSigs({
  pkpPublicKey,
  authMethod,
  sessionSigsParams,
}: {
  pkpPublicKey: string;
  authMethod: AuthMethod;
  sessionSigsParams: GetSessionSigsProps;
}): Promise<SessionSigs> {
  await litNodeClient.connect();
  const sessionSigs = await litNodeClient.getPkpSessionSigs({
    ...sessionSigsParams,
    pkpPublicKey,
    authMethods: [authMethod],
    resourceAbilityRequests: [
      {
        resource: new LitPKPResource('*'),
        ability: LIT_ABILITY.PKPSigning,
      },
    ],
  });

  return sessionSigs;
}

export async function updateSessionSigs(
  params: GetSessionSigsProps
): Promise<SessionSigs> {
  const sessionSigs = await litNodeClient.getSessionSigs(params);
  return sessionSigs;
}

/**
 * Fetch PKPs associated with given auth method
 */
export async function getPKPs(authMethod: AuthMethod): Promise<IRelayPKP[]> {
  console.log("meow", LitRelay.getRelayUrl(SELECTED_LIT_NETWORK))
  const provider = getAuthenticatedProvider(authMethod);
  const allPKPs = await provider.fetchPKPsThroughRelayer(authMethod);
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

  let txHash: string;

  if (authMethod.authMethodType === AUTH_METHOD_TYPE.WebAuthn) {
    // WebAuthn provider requires different steps
    const webAuthnProvider = provider as WebAuthnProvider;
    // Register new WebAuthn credential
    const webAuthnInfo = await webAuthnProvider.register();

    // Verify registration and mint PKP through relay server
    txHash = await webAuthnProvider.verifyAndMintPKPThroughRelayer(webAuthnInfo, options);
  } else {
    // Mint PKP through relay server
    txHash = await provider.mintPKPThroughRelayer(authMethod, options);
  }

  let attempts = 3;
  let response: IRelayPollStatusResponse | null = null;

  while (attempts > 0) {
    try {
      response = await provider.relay.pollRequestUntilTerminalState(txHash);
      break;
    } catch (err) {
      console.warn('Minting failed, retrying...', err);

      // give it a second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts--;
    }
  }

  if (!response || response.status !== 'Succeeded') {
    throw new Error('Minting failed');
  }

  if (!response.pkpTokenId || !response.pkpPublicKey || !response.pkpEthAddress) {
    throw new Error('Minting failed');
  }

  const newPKP: IRelayPKP = {
    tokenId: response.pkpTokenId,
    publicKey: response.pkpPublicKey,
    ethAddress: response.pkpEthAddress,
  };

  return newPKP;
}

// Session storage keys
const SESSION_STORAGE_KEYS = {
  AUTH_METHOD: 'lit-auth-method',
  PKP: 'lit-pkp',
  ACTIVE: 'lit-session-active'
};

/**
 * Store the current session data in local storage
 */
export function storeSession(authMethod: AuthMethod, pkp: IRelayPKP) {
  console.log('Storing session:', { authMethod, pkp });
  console.log("meow", LitRelay.getRelayUrl(SELECTED_LIT_NETWORK))
  localStorage.setItem(SESSION_STORAGE_KEYS.AUTH_METHOD, JSON.stringify(authMethod));
  localStorage.setItem(SESSION_STORAGE_KEYS.PKP, JSON.stringify(pkp));
  localStorage.setItem(SESSION_STORAGE_KEYS.ACTIVE, 'true');
  console.log('Session stored');
}

/**
 * Clear the stored session data
 */
export function clearSession() {
  console.log('Clearing session...', new Error().stack);
  localStorage.removeItem(SESSION_STORAGE_KEYS.AUTH_METHOD);
  localStorage.removeItem(SESSION_STORAGE_KEYS.PKP);
  localStorage.removeItem(SESSION_STORAGE_KEYS.ACTIVE);
}

/**
 * Get the stored session data if it exists
 */
export function getStoredSession(): { authMethod: AuthMethod; pkp: IRelayPKP } | null {
  const storedAuthMethod = localStorage.getItem(SESSION_STORAGE_KEYS.AUTH_METHOD);
  const storedPKP = localStorage.getItem(SESSION_STORAGE_KEYS.PKP);
  const isActive = localStorage.getItem(SESSION_STORAGE_KEYS.ACTIVE);

  console.log('Retrieved session from storage:', { storedAuthMethod, storedPKP, isActive });

  if (!storedAuthMethod || !storedPKP || !isActive) {
    return null;
  }

  try {
    return {
      authMethod: JSON.parse(storedAuthMethod),
      pkp: JSON.parse(storedPKP)
    };
  } catch (err) {
    console.error('Failed to parse stored session:', err);
    clearSession();
    return null;
  }
}

/**
 * Check if there is an active session
 */
export function hasActiveSession(): boolean {
  return localStorage.getItem(SESSION_STORAGE_KEYS.ACTIVE) === 'true';
}