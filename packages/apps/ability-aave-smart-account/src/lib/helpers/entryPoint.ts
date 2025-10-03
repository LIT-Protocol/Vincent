import { ethers } from 'ethers';

import type { UserOpv060 } from './userOperation';

const COMMON_ENTRYPOINTS_VERSIONS: Record<string, string> = {
  '0x0000000071727De22E5E9d8BAf0edAc6f37da032': '0.7.0',
  '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789': '0.6.0',
};

export const entryPointIface = new ethers.utils.Interface([
  'function getNonce(address sender, uint192 key) view returns (uint256)',
]);

// Unpacked (v0.6-style) tuple
export const v060EntryPointIface = new ethers.utils.Interface([
  'function getUserOpHash((address sender,uint256 nonce,bytes initCode,bytes callData,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,bytes paymasterAndData,bytes signature)) view returns (bytes32)',
]);

export const getEntryPointContract = (
  entryPointAddress: string,
  provider: ethers.providers.JsonRpcProvider,
) => new ethers.Contract(entryPointAddress, entryPointIface, provider);

export const getUnpackedEntryPointContract = (
  entryPointAddress: string,
  provider: ethers.providers.JsonRpcProvider,
) => new ethers.Contract(entryPointAddress, v060EntryPointIface, provider);

export const assertValidEntryPointAddress = async (
  entryPointAddress: string,
  provider: ethers.providers.JsonRpcProvider,
) => {
  const supportedEntryPoints = (await provider.send('eth_supportedEntryPoints', [])) as string[];

  if (!supportedEntryPoints.includes(entryPointAddress)) {
    throw new Error('Entry point not supported');
  }

  return true;
};

export const getUserOpVersion = (entryPointAddress: string) => {
  const version = COMMON_ENTRYPOINTS_VERSIONS[entryPointAddress];
  if (!version) {
    throw new Error('Entry point version not supported');
  }

  return version;
};

export const getSmartAccountNonce = async ({
  accountAddress,
  entryPointAddress,
  key = 0,
  provider,
}: {
  accountAddress: string;
  entryPointAddress: string;
  key?: number;
  provider: ethers.providers.JsonRpcProvider;
}) => {
  const entryPoint = getEntryPointContract(entryPointAddress, provider);
  return await entryPoint.getNonce(accountAddress, key);
};

export const hashUnpackedUserOp = async ({
  entryPointAddress,
  userOp,
  provider,
}: {
  entryPointAddress: string;
  userOp: UserOpv060;
  provider: ethers.providers.JsonRpcProvider;
}) => {
  const unpacked = {
    sender: userOp.sender,
    nonce: ethers.BigNumber.from(userOp.nonce),
    initCode: userOp.initCode,
    callData: userOp.callData,
    callGasLimit: ethers.BigNumber.from(userOp.callGasLimit),
    verificationGasLimit: ethers.BigNumber.from(userOp.verificationGasLimit),
    preVerificationGas: ethers.BigNumber.from(userOp.preVerificationGas),
    maxFeePerGas: ethers.BigNumber.from(userOp.maxFeePerGas),
    maxPriorityFeePerGas: ethers.BigNumber.from(userOp.maxPriorityFeePerGas),
    paymasterAndData: userOp.paymasterAndData,
    signature: '0x',
  };

  const epUnpacked = new ethers.Contract(entryPointAddress, v060EntryPointIface, provider);
  const hash = await epUnpacked.getUserOpHash(unpacked);

  return ethers.utils.arrayify(hash);
};
