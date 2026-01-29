import { Wallet } from 'ethers';

export async function completeAppInstallation({
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
  console.log('=== Completing app installation via Vincent API (gas-sponsored) ===');

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
