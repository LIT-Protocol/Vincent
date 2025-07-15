import { ethers } from 'ethers';
import { ERC20_ABI } from '../helpers';
import { laUtils } from '@lit-protocol/vincent-scaffold-sdk';

export const sendErc20ApprovalTx = async ({
  rpcUrl,
  chainId,
  pkpEthAddress,
  pkpPublicKey,
  spenderAddress,
  tokenAmount,
  tokenAddress,
  alchemyGasSponsor,
  alchemyGasSponsorApiKey,
  alchemyGasSponsorPolicyId,
}: {
  rpcUrl: string;
  chainId: number;
  pkpEthAddress: string;
  pkpPublicKey: string;
  spenderAddress: string;
  tokenAmount: bigint;
  tokenAddress: string;
  alchemyGasSponsor: boolean;
  alchemyGasSponsorApiKey?: string;
  alchemyGasSponsorPolicyId?: string;
}) => {
  console.log('sendErc20ApprovalTx', {
    rpcUrl,
    chainId,
    pkpEthAddress,
    pkpPublicKey,
    spenderAddress,
    tokenAmount: tokenAmount.toString(),
    tokenAddress,
    alchemyGasSponsor,
  });

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  // Convert bigint to ethers.BigNumber for proper encoding
  const tokenAmountBN = ethers.BigNumber.from(tokenAmount.toString());

  const functionName = 'approve';
  const args = [spenderAddress, tokenAmountBN];

  if (alchemyGasSponsor) {
    console.log('Alchemy gas sponsor is enabled');

    if (!alchemyGasSponsorApiKey || !alchemyGasSponsorPolicyId) {
      throw new Error('Alchemy gas sponsor is enabled, but API key or policy ID is not provided.');
    }
    return await laUtils.transaction.handler.sponsoredGasContractCall({
      pkpPublicKey,
      abi: ERC20_ABI,
      contractAddress: tokenAddress,
      functionName,
      args,
      chainId,
      eip7702AlchemyApiKey: alchemyGasSponsorApiKey,
      eip7702AlchemyPolicyId: alchemyGasSponsorPolicyId,
    });
  } else {
    return await laUtils.transaction.handler.contractCall({
      provider,
      pkpPublicKey,
      callerAddress: pkpEthAddress,
      abi: ERC20_ABI,
      contractAddress: tokenAddress,
      functionName,
      args,
      chainId,
    });
  }
};
