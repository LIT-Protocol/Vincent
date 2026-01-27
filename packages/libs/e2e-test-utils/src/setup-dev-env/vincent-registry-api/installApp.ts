import { privateKeyToAccount } from 'viem/accounts';

export interface InstallAppResponse {
  agentSignerAddress: string;
  agentSmartAccountAddress: string;
  appInstallationDataToSign: {
    typedData: any;
  };
  agentSmartAccountDeploymentDataToSign: any; // Raw message to sign (from getAppInstallTypedData)
  sessionKeyApprovalDataToSign: any; // Serialized permission account (from getSessionKeyApprovalTypedData)
  alreadyInstalled?: boolean;
}

export async function installApp({
  vincentApiUrl,
  appId,
  userEoaPrivateKey,
}: {
  vincentApiUrl: string;
  appId: number;
  userEoaPrivateKey: string;
}): Promise<InstallAppResponse> {
  console.log('=== Installing app via Vincent API (gas-sponsored) ===');

  const userEoaAccount = privateKeyToAccount(userEoaPrivateKey as `0x${string}`);

  const response = await fetch(`${vincentApiUrl}/user/${appId}/install-app`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userControllerAddress: userEoaAccount.address,
      sponsorGas: true, // Always sponsor gas
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Install app via Vincent API failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = (await response.json()) as InstallAppResponse;

  console.table({
    'Agent Signer Address': data.agentSignerAddress,
    'Agent Smart Account Address': data.agentSmartAccountAddress,
  });

  return data;
}
