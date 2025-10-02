import { ethers } from 'ethers';

import type { UserOpv060 } from './userOperation';

export const entryPointIface = new ethers.utils.Interface([
  'function getNonce(address sender, uint192 key) view returns (uint256)',
]);

// Unpacked (v0.6-style) tuple
export const unpackedEntryPointIface = new ethers.utils.Interface([
  'function getUserOpHash((address sender,uint256 nonce,bytes initCode,bytes callData,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,bytes paymasterAndData,bytes signature)) view returns (bytes32)',
]);

export const getEntryPointContract = (
  entryPointAddress: string,
  provider: ethers.providers.JsonRpcProvider,
) => new ethers.Contract(entryPointAddress, entryPointIface, provider);

export const getUnpackedEntryPointContract = (
  entryPointAddress: string,
  provider: ethers.providers.JsonRpcProvider,
) => new ethers.Contract(entryPointAddress, unpackedEntryPointIface, provider);

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

  const epUnpacked = new ethers.Contract(entryPointAddress, unpackedEntryPointIface, provider);
  const hash = await epUnpacked.getUserOpHash(unpacked);

  return ethers.utils.arrayify(hash);
};
