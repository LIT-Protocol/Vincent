import type { InfoClient } from '@nktkas/hyperliquid';

/**
 * Check if a given address has approved a given builder address
 * @param infoClient - Hyperliquid InfoClient instance
 * @param ethAddress - Ethereum address to check approval for
 * @param builderAddress - Builder address to check approval for
 * @returns true if the builder is approved, false otherwise
 */
export const isBuilderCodeApproved = async ({
  infoClient,
  ethAddress,
  builderAddress,
}: {
  infoClient: InfoClient;
  ethAddress: string;
  builderAddress: string;
}): Promise<boolean> => {
  // Call maxBuilderFee to get the maximum builder fee approved for this builder
  // If the builder is not approved, this will return 0
  const maxFee = await infoClient.maxBuilderFee({
    user: ethAddress as `0x${string}`,
    builder: builderAddress as `0x${string}`,
  });

  // Builder is approved if maxFee is greater than 0
  const isApproved = typeof maxFee === 'number' && maxFee > 0;

  console.log('[isBuilderCodeApproved] Builder approval check', {
    ethAddress,
    builderAddress,
    maxFee,
    isApproved,
  });

  return isApproved;
};
