import { laUtils } from '@lit-protocol/vincent-scaffold-sdk';

/**
 * Generic function to execute any ERC20 operation, with optional gas sponsorship
 */
export async function executeOperation({
  provider,
  pkpPublicKey,
  callerAddress,
  contractAddress,
  functionName,
  args,
  chainId,
  abi,
  alchemyGasSponsor,
  alchemyGasSponsorApiKey,
  alchemyGasSponsorPolicyId,
}: {
  provider?: any;
  pkpPublicKey: string;
  callerAddress: string;
  contractAddress: string;
  functionName: string;
  args: any[];
  chainId: number;
  abi: any;
  alchemyGasSponsor?: boolean;
  alchemyGasSponsorApiKey?: string;
  alchemyGasSponsorPolicyId?: string;
}): Promise<string> {
  console.log(
    `[@lit-protocol/vincent-ability-erc20-transfer/executeOperation] Starting ${functionName} operation`,
    { sponsored: !!alchemyGasSponsor },
  );

  // Use gas sponsorship if enabled and all required parameters are provided
  if (alchemyGasSponsor && alchemyGasSponsorApiKey && alchemyGasSponsorPolicyId) {
    console.log(
      `[@lit-protocol/vincent-ability-erc20-transfer/executeOperation] Using EIP-7702 gas sponsorship`,
      { callerAddress, contractAddress, functionName, args, policyId: alchemyGasSponsorPolicyId },
    );

    try {
      return await laUtils.transaction.handler.sponsoredGasContractCall({
        pkpPublicKey,
        abi,
        contractAddress,
        functionName,
        args,
        chainId,
        eip7702AlchemyApiKey: alchemyGasSponsorApiKey,
        eip7702AlchemyPolicyId: alchemyGasSponsorPolicyId,
      });
    } catch (error) {
      console.error(
        `[@lit-protocol/vincent-ability-erc20-transfer/executeOperation] EIP-7702 operation failed:`,
        error,
      );
      throw error;
    }
  } else {
    // Use regular transaction without gas sponsorship
    console.log(
      `[@lit-protocol/vincent-ability-erc20-transfer/executeOperation] Using regular transaction`,
    );

    if (!provider) {
      throw new Error('Provider is required for non-sponsored transactions');
    }

    try {
      return await laUtils.transaction.handler.contractCall({
        provider,
        pkpPublicKey,
        callerAddress,
        abi,
        contractAddress,
        functionName,
        args,
        chainId,
      });
    } catch (error) {
      console.error(
        `[@lit-protocol/vincent-ability-erc20-transfer/executeOperation] Regular transaction failed:`,
        error,
      );
      throw error;
    }
  }
}
