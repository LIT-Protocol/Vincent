import { Account } from 'viem';
import { VincentNetworkContext } from '../../../_vincentConfig';
import { createVincentContracts } from '../../utils/createVincentContracts';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

export async function registerTool(request: any, ctx: VincentNetworkContext) {
  const {
    vincentToolFacetContract,
    vincentToolViewFacetContract,
    publicClient,
  } = createVincentContracts(ctx);

  const hash = await vincentToolFacetContract.write.registerTool(
    [request.toolIpfsCid],
    {
      account: ctx.walletClient.account as Account,
      chain: ctx.chainConfig.chain,
    }
  );
  console.log(hash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  if (decodedLogs.length <= 0) {
    throw new Error('This tool has already been registered');
  }

  const view = await vincentToolViewFacetContract.read.getAllRegisteredTools();

  return { hash, receipt, decodedLogs, view };
}

if (import.meta.main) {
  const { vincentNetworkContext } = await import('../../../_vincentConfig');

  const res = await registerTool(
    {
      toolIpfsCid: 'QmSQDKRWEXZ9CGoucSTR11Mv6fhGqaytZ1MqrfHdkuS999',
    },
    vincentNetworkContext
  );

  console.log(res);
}
