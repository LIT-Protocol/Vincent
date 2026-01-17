/**
 * Install app response from Vincent API (gas-sponsored mode via Gelato)
 */
export interface InstallAppResponseSponsored {
  agentSignerAddress: string;
  agentSmartAccountAddress: string;
  appInstallationDataToSign: {
    typedData: any;
  };
}

/**
 * Install app response from Vincent API (user-paid direct submission mode)
 */
export interface InstallAppResponseDirect {
  agentSignerAddress: string;
  agentSmartAccountAddress: string;
  transaction: {
    to: string;
    data: string;
  };
}

export type InstallAppResponse = InstallAppResponseSponsored | InstallAppResponseDirect;

/**
 * Type guard to check if response is sponsored mode
 */
export function isInstallAppResponseSponsored(
  response: InstallAppResponse,
): response is InstallAppResponseSponsored {
  return 'appInstallationDataToSign' in response;
}

/**
 * Install app via Vincent API to create a PKP for the user.
 *
 * This mints a new PKP (Programmable Key Pair) on Chronicle Yellowstone that will act as
 * a session key for the user's smart account. The PKP is burned (non-transferable) and bound
 * to the specific app version.
 *
 * The sponsorGas parameter controls the transaction submission method:
 * - false (default): Returns raw transaction data for direct submission from user EOA (user pays gas)
 * - true: Returns EIP-712 typed data for gas-sponsored relay via Gelato
 *
 * @param params - Installation parameters
 * @param params.sponsorGas - If false, returns raw transaction data for direct submission. If true, returns EIP-712 typed data for Gelato relay (default: false)
 * @returns Installation response with PKP signer address and smart account address
 *
 * @example
 * ```typescript
 * // Direct submission (user pays gas) - recommended for development
 * const installData = await installAppViaVincentApi({
 *   vincentApiUrl: 'https://api.heyvincent.ai',
 *   appId: 1,
 *   userEoaAddress: '0x...',
 *   sponsorGas: false,
 * });
 *
 * // Gas-sponsored via Gelato - for production
 * const installData = await installAppViaVincentApi({
 *   vincentApiUrl: 'https://api.heyvincent.ai',
 *   appId: 1,
 *   userEoaAddress: '0x...',
 *   sponsorGas: true,
 * });
 * ```
 */
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

  console.log('App installation successful');
  console.table([
    { 'Agent Signer Address': data.agentSignerAddress },
    { 'Agent Smart Account Address': data.agentSmartAccountAddress },
  ]);

  return data;
}
