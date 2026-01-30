import { Wallet } from 'ethers';
import { privateKeyToAccount } from 'viem/accounts';

export interface CompleteInstallationResult {
  deployAgentSmartAccountTransactionHash: string;
  serializedPermissionAccount: string;
  completeAppInstallationTransactionHash: string;
}

export async function completeAppInstallation({
  vincentApiUrl,
  userEoaPrivateKey,
  appId,
  appInstallationDataToSign,
  agentSmartAccountDeploymentDataToSign,
  sessionKeyApprovalDataToSign,
  agentSignerAddress,
}: {
  vincentApiUrl: string;
  userEoaPrivateKey: string;
  appId: number;
  appInstallationDataToSign: any;
  agentSmartAccountDeploymentDataToSign: any;
  sessionKeyApprovalDataToSign: any;
  agentSignerAddress: string;
}): Promise<CompleteInstallationResult> {
  console.log('=== Completing app installation via Vincent API (gas-sponsored) ===');

  // Sign the three pieces of typed data
  const wallet = new Wallet(userEoaPrivateKey);
  const viemAccount = privateKeyToAccount(userEoaPrivateKey as `0x${string}`);

  // 1. Sign the app installation EIP-712 typed data (for permitAppVersion)
  const appInstallationTypedData = appInstallationDataToSign.typedData;
  const { EIP712Domain: _, ...appInstallationTypesWithoutDomain } = appInstallationTypedData.types;
  const appInstallationSignature = await wallet._signTypedData(
    appInstallationTypedData.domain,
    appInstallationTypesWithoutDomain,
    appInstallationTypedData.message,
  );

  // 2. Sign the smart account deployment message (raw message from getAppInstallTypedData)
  const agentSmartAccountDeploymentSignature = await viemAccount.signMessage({
    message: { raw: agentSmartAccountDeploymentDataToSign.messageToSign },
  });

  // 3. Sign the session key approval (serialized permission account from getSessionKeyApprovalTypedData)
  const sessionKeyApprovalSignature = await viemAccount.signTypedData(sessionKeyApprovalDataToSign);

  // Submit to Vincent API to complete installation
  const response = await fetch(`${vincentApiUrl}/user/${appId}/complete-installation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userControllerAddress: viemAccount.address,
      agentSignerAddress,
      appId,
      appInstallation: {
        typedDataSignature: appInstallationSignature,
        dataToSign: appInstallationDataToSign,
      },
      agentSmartAccountDeployment: {
        typedDataSignature: agentSmartAccountDeploymentSignature,
        userOperation: agentSmartAccountDeploymentDataToSign.userOperation,
      },
      sessionKeyApproval: {
        typedDataSignature: sessionKeyApprovalSignature,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Complete app installation via Vincent API failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = (await response.json()) as CompleteInstallationResult;

  console.table({
    'Deploy Smart Account Tx': data.deployAgentSmartAccountTransactionHash,
    'Serialized Permission Account': data.serializedPermissionAccount.substring(0, 50) + '...',
    'Complete Installation Tx': data.completeAppInstallationTransactionHash,
  });

  return data;
}
