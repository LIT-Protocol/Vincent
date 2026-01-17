import type { Hex } from 'viem';

import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { bundledVincentAbility } from '@lit-protocol/vincent-ability-aave';
import { ethers } from 'ethers';

export async function signUserOp(params: {
  userOp: Record<string, unknown>;
  alchemyRpcUrl: string;
  delegateePrivateKey: string;
  delegatorPkpEthAddress: string;
  agentAddress: string;
}): Promise<{ signature: Hex }> {
  const { userOp, alchemyRpcUrl, delegateePrivateKey, delegatorPkpEthAddress, agentAddress } =
    params;

  const delegateeSigner = new ethers.Wallet(delegateePrivateKey);
  const abilityClient = getVincentAbilityClient({
    ethersSigner: delegateeSigner,
    bundledVincentAbility,
  });

  const precheck = await abilityClient.precheck(
    {
      userOp,
      alchemyRpcUrl,
    },
    {
      delegatorPkpEthAddress,
      agentAddress,
    },
  );

  if (!precheck.success) {
    throw new Error(precheck.result?.error || precheck.runtimeError || 'Ability precheck failed');
  }

  const execute = await abilityClient.execute(
    {
      userOp,
      alchemyRpcUrl,
    },
    {
      delegatorPkpEthAddress,
      agentAddress,
    },
  );

  if (!execute.success) {
    throw new Error(execute.result?.error || execute.runtimeError || 'Ability execute failed');
  }

  return { signature: execute.result.signature as Hex };
}
