import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';

// Define raw types from the contract
type RawContractMethod = ReturnType<
  typeof createVincentContracts
>['vincentLitActionViewFacetContract']['read']['getLitActionIpfsCidByHash'];
type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

const ExpectedParams = z
  .object({
    litActionIpfsCidHash: z.string().refine((val) => /^0x[a-fA-F0-9]{64}$/.test(val), {
      message: 'litActionIpfsCidHash must be a valid 32-byte hex string starting with 0x',
    }),
  })
  .transform((params): RawContractParams => [params.litActionIpfsCidHash as `0x${string}`]);

type ExpectedParams = z.input<typeof ExpectedParams>;

/**
 * Retrieves a lit action's IPFS CID by its hash
 * @param request The request containing the lit action IPFS CID hash to look up
 * @param ctx The Vincent network context
 * @returns The lit action's IPFS CID
 */
export async function getLitActionIpfsCidByHash(
  request: ExpectedParams,
  ctx: VincentNetworkContext,
): Promise<{ litActionIpfsCid: RawContractResponse }> {
  const validatedRequest = ExpectedParams.parse(request);
  logger.debug({ validatedRequest });

  const { vincentLitActionViewFacetContract } = createVincentContracts(ctx);

  const litActionIpfsCid =
    await vincentLitActionViewFacetContract.read.getLitActionIpfsCidByHash(validatedRequest);

  logger.debug({ litActionIpfsCid });

  return { litActionIpfsCid };
}
