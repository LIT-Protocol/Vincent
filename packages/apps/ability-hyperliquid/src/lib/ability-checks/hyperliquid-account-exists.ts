import type { InfoClient } from '@nktkas/hyperliquid';

export const hyperliquidAccountExists = async ({
  infoClient,
  ethAddress,
}: {
  infoClient: InfoClient;
  ethAddress: string;
}) => {
  try {
    await infoClient.clearinghouseState({ user: ethAddress });
    return true;
  } catch (error) {
    console.error(
      '[@lit-protocol/vincent-ability-hyperliquid precheck] Error checking clearinghouse state',
      error,
    );

    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('does not exist')) {
      return false;
    } else {
      // Unknown error occurred - not a "does not exist" error
      throw error;
    }
  }
};
