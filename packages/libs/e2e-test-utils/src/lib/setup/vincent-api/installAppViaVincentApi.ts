export interface InstallAppResponseSponsored {
  agentSignerAddress: string;
  agentSmartAccountAddress: string;
  appInstallationDataToSign: {
    typedData: any;
  };
  alreadyInstalled?: boolean;
}

export interface InstallAppResponseDirect {
  agentSignerAddress: string;
  agentSmartAccountAddress: string;
  rawTransaction: {
    to: string;
    data: string;
  };
  alreadyInstalled?: boolean;
}

export interface InstallAppResponseAlreadyInstalled {
  agentSignerAddress: string;
  agentSmartAccountAddress: string;
  alreadyInstalled: true;
}

export type InstallAppResponse =
  | InstallAppResponseSponsored
  | InstallAppResponseDirect
  | InstallAppResponseAlreadyInstalled;

export function isInstallAppResponseSponsored(
  response: InstallAppResponse,
): response is InstallAppResponseSponsored {
  return 'appInstallationDataToSign' in response;
}

export async function installAppViaVincentApi({
  vincentApiUrl,
  appId,
  userEoaAddress,
  sponsorGas = false,
}: {
  vincentApiUrl: string;
  appId: number;
  userEoaAddress: string;
  sponsorGas?: boolean;
}): Promise<InstallAppResponse> {
  console.log('=== Installing app via Vincent API ===');

  const response = await fetch(`${vincentApiUrl}/user/${appId}/install-app`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userControllerAddress: userEoaAddress,
      sponsorGas,
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
