import * as hyperliquid from '@nktkas/hyperliquid';
import { approveBuilderFee, SuccessResponse } from '@nktkas/hyperliquid/api/exchange';
import { LitActionPkpEthersWallet } from './lit-action-pkp-ethers-wallet';
import { DEFAULT_BUILDER } from '../constants';

export async function approveBuilderFeeAction({
  transport,
  pkpPublicKey,
  useTestnet = false,
}: {
  transport: hyperliquid.HttpTransport;
  pkpPublicKey: string;
  useTestnet?: boolean;
}): Promise<SuccessResponse> {
  const pkpWallet = new LitActionPkpEthersWallet(pkpPublicKey);

  const response = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'HyperLiquidApproveBuilderFee' },
    async () => {
      return JSON.stringify(
        await approveBuilderFee(
          { transport, wallet: pkpWallet },
          { builder: DEFAULT_BUILDER.address, maxFeeRate: DEFAULT_BUILDER.maxFeeRate },
        ),
      );
    },
  );

  return JSON.parse(response) as SuccessResponse;
}
