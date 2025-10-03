import { sponsoredGasRawTransaction } from './sponsored-gas-raw-transaction';

declare const ethers: {
  utils: {
    Interface: any;
  };
};

/**
 * Handler function for making contract calls
 * This function handles the preparation, signing, and sending of contract transactions
 *
 * @param pkpPublicKey - The PKP public key for transaction signing
 * @param pkpEthAddress - The ethereum address derived from PKP
 * @param abi - The ABI of the contract function
 * @param contractAddress - The contract address
 * @param functionName - The name of the function to call
 * @param args - The arguments to pass to the function
 * @param overrides - Optional transaction overrides (value)
 * @param chainId - Optional chain ID (defaults to yellowstoneConfig.id)
 * @param eip7702AlchemyApiKey - The Alchemy API key for gas sponsorship
 * @param eip7702AlchemyPolicyId - The Alchemy policy ID for gas sponsorship
 * @returns The UserOperation hash.  You must use the alchemy smartAccountClient.waitForUserOperationTransaction() to convert the userOp into a txHash.
 */
export const sponsoredGasContractCall = async ({
  pkpPublicKey,
  abi,
  contractAddress,
  functionName,
  args,
  overrides = {},
  chainId,
  eip7702AlchemyApiKey,
  eip7702AlchemyPolicyId,
}: {
  pkpPublicKey: string;
  abi: any[];
  contractAddress: string;
  functionName: string;
  args: any[];
  overrides?: {
    value?: string | number | bigint;
  };
  chainId?: number;
  eip7702AlchemyApiKey?: string;
  eip7702AlchemyPolicyId?: string;
}) => {
  // Step 1: Encode function data using ethers Interface
  const iface = new ethers.utils.Interface(abi);
  const encodedData = iface.encodeFunctionData(functionName, args);

  console.log('Encoded data:', encodedData);

  if (!eip7702AlchemyApiKey || !eip7702AlchemyPolicyId) {
    throw new Error(
      'EIP7702 Alchemy API key and policy ID are required when using Alchemy for gas sponsorship',
    );
  }

  if (!chainId) {
    throw new Error('Chain ID is required when using Alchemy for gas sponsorship');
  }

  // Convert value override if exists to BigNumber
  const txValue = overrides.value ? BigInt(overrides.value.toString()) : 0n;

  return sponsoredGasRawTransaction({
    pkpPublicKey,
    to: contractAddress,
    value: txValue.toString(),
    data: encodedData,
    chainId,
    eip7702AlchemyApiKey,
    eip7702AlchemyPolicyId,
  });
};
