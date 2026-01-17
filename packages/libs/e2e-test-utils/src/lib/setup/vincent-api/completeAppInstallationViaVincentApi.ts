import { Wallet } from 'ethers';

/**
 * Complete app installation by signing and submitting the permit transaction.
 *
 * This function:
 * 1. Signs the EIP-712 typed data with the user's private key
 * 2. Submits the signature to the Vincent API
 * 3. The API relays the permitAppVersion call to the Vincent contract via Gelato
 *
 * This establishes the agent (smart account) <-> app relationship in the Vincent contract.
 *
 * @param params - Installation completion parameters
 * @returns Transaction hash of the permitAppVersion transaction
 *
 * @example
 * ```typescript
 * const txHash = await completeAppInstallationViaVincentApi({
 *   vincentApiUrl: 'https://api.heyvincent.ai',
 *   userEoaPrivateKey: '0x...',
 *   appId: 1,
 *   appInstallationDataToSign: installData.appInstallationDataToSign,
 * });
 *
 * console.log('Permit transaction hash:', txHash);
 * ```
 */
export async function completeAppInstallationViaVincentApi({
  vincentApiUrl,
  userEoaPrivateKey,
  appId,
  appInstallationDataToSign,
}: {
  vincentApiUrl: string;
  userEoaPrivateKey: string;
  appId: number;
  appInstallationDataToSign: any;
}): Promise<string> {
  // Sign the EIP-712 typed data
  const wallet = new Wallet(userEoaPrivateKey);
  const typedData = appInstallationDataToSign.typedData;

  // Remove EIP712Domain from types as ethers.js doesn't expect it
  // (it's automatically added by ethers based on the domain object)
  const { EIP712Domain, ...typesWithoutDomain } = typedData.types;

  // EIP-712 signing: sign the typed data structure
  const signature = await wallet._signTypedData(
    typedData.domain,
    typesWithoutDomain,
    typedData.message,
  );

  // Submit to Vincent API to complete installation (this relays the permitAppVersion call)
  const response = await fetch(`${vincentApiUrl}/user/${appId}/complete-installation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      typedDataSignature: signature,
      appInstallationDataToSign,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Complete app installation via Vincent API failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = (await response.json()) as { transactionHash: string };

  return data.transactionHash;
}
