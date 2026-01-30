import { Wallet } from 'ethers';
import { getAddress } from 'viem';
import crypto from 'crypto';

/**
 * Generate a secure random nonce for SIWE
 */
function generateNonce(): string {
  // Generate 16 random bytes and convert to hex string
  const array = new Uint8Array(16);
  crypto.randomFillSync(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates a SIWE message following the EIP-4361 spec
 */
function createSiweMessage(params: {
  domain: string;
  address: string;
  uri: string;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  statement?: string;
  chainId?: number;
  version?: string;
}): string {
  const {
    domain,
    address,
    uri,
    nonce,
    issuedAt,
    expirationTime,
    statement = 'Sign in with Ethereum to authenticate with Vincent Registry API',
    chainId = 85452,
    version = '1',
  } = params;

  const lines = [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    statement,
    '',
    `URI: ${uri}`,
    `Version: ${version}`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ];

  if (expirationTime) {
    lines.push(`Expiration Time: ${expirationTime}`);
  }

  return lines.join('\n');
}

/**
 * Infers the SIWE domain and URI from the Vincent API URL
 * Production: url='https://api.heyvincent.ai' -> domain='vincent-dashboard-20.vercel.app', uri='https://api.heyvincent.ai'
 * Development: url='http://localhost:3000' -> domain='localhost:3000', uri='http://localhost:3000'
 */
function inferDomainAndUri(apiUrl: string): { domain: string; uri: string } {
  const urlObj = new URL(apiUrl);

  // Check if it's production API
  if (urlObj.hostname === 'api.heyvincent.ai') {
    return {
      domain: 'vincent-dashboard-20.vercel.app',
      uri: apiUrl,
    };
  }

  // For localhost or other environments, use the URL's host (including port)
  return {
    domain: urlObj.host, // includes port if present
    uri: apiUrl,
  };
}

/**
 * Generates a SIWE (Sign-In with Ethereum) authentication header for Vincent Registry API
 * @param appManagerPrivateKey - The private key of the app manager
 * @param vincentApiUrl - The Vincent Registry API URL (e.g., 'http://localhost:3000' or 'https://api.heyvincent.ai')
 * @param domain - Optional override for the domain (if not provided, will be inferred from vincentApiUrl)
 * @returns The Authorization header value in the format "SIWE <base64-encoded-payload>"
 */
export async function generateSiweAuth({
  appManagerPrivateKey,
  vincentApiUrl,
  domain: domainOverride,
}: {
  appManagerPrivateKey: `0x${string}`;
  vincentApiUrl?: string;
  domain?: string;
}): Promise<string> {
  const wallet = new Wallet(appManagerPrivateKey);

  // Get checksummed address (EIP-55 required by SIWE)
  const address = await wallet.getAddress();
  const checksummedAddress = getAddress(address);

  // Infer domain and URI from the API URL, or use override
  let domain: string;
  let uri: string;

  if (domainOverride) {
    // If domain is explicitly provided, use it
    domain = domainOverride;
    // Infer URI from domain if not using vincentApiUrl
    uri =
      vincentApiUrl || (domain.includes('localhost') ? `http://${domain}` : `https://${domain}`);
  } else if (vincentApiUrl) {
    // Infer both domain and URI from the API URL
    const inferred = inferDomainAndUri(vincentApiUrl);
    domain = inferred.domain;
    uri = inferred.uri;
  } else {
    // Fallback to localhost defaults
    domain = 'localhost:3000';
    uri = 'http://localhost:3000';
  }

  const timestamp = Date.now();
  const issuedAt = new Date(timestamp).toISOString();
  const expirationTime = new Date(timestamp + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  // Create the SIWE message
  const message = createSiweMessage({
    domain,
    address: checksummedAddress,
    uri,
    nonce: generateNonce(),
    issuedAt,
    expirationTime,
  });

  // Request signature from wallet
  const signature = await wallet.signMessage(message);

  // Create the payload
  const payload = JSON.stringify({
    message,
    signature,
  });

  // Encode as base64
  const base64Payload = Buffer.from(payload, 'utf-8').toString('base64');

  // Return the Authorization header value
  return `SIWE ${base64Payload}`;
}
