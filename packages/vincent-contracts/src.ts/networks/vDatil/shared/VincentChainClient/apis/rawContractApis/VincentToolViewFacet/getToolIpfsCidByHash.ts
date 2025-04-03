import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';

// Define raw types from the contract
type RawContractMethod = ReturnType<
  typeof createVincentContracts
>['vincentToolViewFacetContract']['read']['getToolIpfsCidByHash'];
type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

const ExpectedParams = z
  .object({
    toolIpfsCidHash: z
      .string()
      .refine((val) => /^0x[a-fA-F0-9]{64}$/.test(val), {
        message:
          'toolIpfsCidHash must be a valid 32-byte hex string starting with 0x',
      }),
  })
  .transform(
    (params): RawContractParams => [params.toolIpfsCidHash as `0x${string}`],
  );

type ExpectedParams = z.input<typeof ExpectedParams>;

/**
 * Retrieves a tool's IPFS CID by its hash
 * @param request The request containing the tool IPFS CID hash to look up
 * @param ctx The Vincent network context
 * @returns The tool's IPFS CID
 */
export async function getToolIpfsCidByHash(
  request: ExpectedParams,
  ctx: VincentNetworkContext,
): Promise<{ toolIpfsCid: RawContractResponse }> {
  const validatedRequest = ExpectedParams.parse(request);
  logger.debug({ validatedRequest });

  const { vincentToolViewFacetContract } = createVincentContracts(ctx);

  const toolIpfsCid =
    await vincentToolViewFacetContract.read.getToolIpfsCidByHash(
      validatedRequest,
    );

  logger.debug({ toolIpfsCid });

  return { toolIpfsCid };
}
