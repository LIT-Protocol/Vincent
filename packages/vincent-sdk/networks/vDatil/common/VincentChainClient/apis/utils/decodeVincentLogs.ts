import { decodeEventLog, Log } from 'viem';
import { VincentNetworkContext } from '../../_vincentConfig';
import { createVincentContracts } from './createVincentContracts';

export type DecodedLog = {
  eventName: string;
  args: {
    [key: string]: any;
  };
};

/**
 * Decodes event logs from Lit Protocol contract transactions
 * @param logs Array of transaction logs to decode
 * @returns Array of decoded logs with event names and parameters
 */
export const decodeVincentLogs = async (
  logs: Log[],
  networkCtx: VincentNetworkContext
): Promise<DecodedLog[]> => {
  // Get network context for contract ABIs
  const networkContext = networkCtx.chainConfig.contractData;

  if (!networkContext) {
    throw new Error(`Network "${networkCtx.network}" not found`);
  }

  const {
    vincentAppFacetContract,
    vincentAppViewFacetContract,
    vincentToolFacetContract,
    vincentToolViewFacetContract,
    vincentUserFacetContract,
    vincentUserViewFacetContract,
    publicClient,
    walletClient,
  } = createVincentContracts(networkCtx, {
    useDiamondAddress: false,
  });

  // Map contract addresses to their ABIs
  const contractABIs = new Map<string, any>();
  contractABIs.set(
    vincentAppFacetContract.address.toLowerCase(),
    vincentAppFacetContract.abi
  );
  contractABIs.set(
    vincentAppViewFacetContract.address.toLowerCase(),
    vincentAppViewFacetContract.abi
  );
  contractABIs.set(
    vincentToolFacetContract.address.toLowerCase(),
    vincentToolFacetContract.abi
  );
  contractABIs.set(
    vincentToolViewFacetContract.address.toLowerCase(),
    vincentToolViewFacetContract.abi
  );
  contractABIs.set(
    vincentUserFacetContract.address.toLowerCase(),
    vincentUserFacetContract.abi
  );
  contractABIs.set(
    vincentUserViewFacetContract.address.toLowerCase(),
    vincentUserViewFacetContract.abi
  );

  const allAbis = Array.from(contractABIs.values());

  const flattenedAbis = allAbis.flat();

  // Decode each log
  const decodedLogs = logs.map((log) => {
    try {
      // const abi = contractABIs.get(log.address.toLowerCase());
      // if (!abi) {
      //   return {
      //     ...log,
      //     decoded: null,
      //     error: 'No matching ABI found for address',
      //   };
      // }

      const decoded = decodeEventLog({
        abi: flattenedAbis,
        data: log.data,
        topics: log.topics,
      });

      return decoded;
    } catch (error) {
      return {
        ...log,
        decoded: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  return decodedLogs as DecodedLog[];
};
