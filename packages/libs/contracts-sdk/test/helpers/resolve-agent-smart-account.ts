import type { Address, Chain } from 'viem';
import type { PrivateKeyAccount } from 'viem/accounts';

import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { toInitConfig, toPermissionValidator } from '@zerodev/permissions';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { addressToEmptyAccount, createKernelAccount } from '@zerodev/sdk';
import { KERNEL_V3_3, getEntryPoint } from '@zerodev/sdk/constants';
import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';

import type { TestConfig } from './test-config';

import { saveTestConfig } from './test-config';
import { TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY, TEST_CONFIG_PATH } from './test-variables';

const kernelVersion = KERNEL_V3_3;
const entryPoint = getEntryPoint('0.7');

const getZerodevTransport = () => {
  const rpcUrl = process.env.ZERODEV_RPC_URL;
  if (!rpcUrl) {
    throw new Error('Missing ZERODEV_RPC_URL env variable');
  }
  return http(rpcUrl);
};

const resolveSmartAccountChain = (chainId: number) => {
  if (chainId === baseSepolia.id) {
    return baseSepolia;
  }
  if (chainId === base.id) {
    return base;
  }
  throw new Error(
    `Unsupported SMART_ACCOUNT_CHAIN_ID ${chainId}. Expected ${baseSepolia.id} (Base Sepolia) or ${base.id} (Base).`,
  );
};

const getPermissionEmptyValidator = async (
  publicClient: ReturnType<typeof createPublicClient>,
  permittedAddress: Address,
) => {
  const permittedEmptyAccount = addressToEmptyAccount(permittedAddress);
  const permittedEmptySigner = await toECDSASigner({
    signer: permittedEmptyAccount,
  });
  return toPermissionValidator(publicClient, {
    entryPoint,
    kernelVersion,
    signer: permittedEmptySigner,
    policies: [toSudoPolicy({})],
  });
};

const deriveZerodevSmartAccountAddress = async ({
  ownerAccount,
  permittedAddress,
  chain,
}: {
  ownerAccount: PrivateKeyAccount;
  permittedAddress: Address;
  chain: Chain;
}) => {
  const publicClient = createPublicClient({
    chain,
    transport: getZerodevTransport(),
  });

  const ownerValidator = await signerToEcdsaValidator(publicClient, {
    entryPoint,
    kernelVersion,
    signer: ownerAccount,
  });

  const permissionValidator = await getPermissionEmptyValidator(publicClient, permittedAddress);

  const kernelAccount = await createKernelAccount(publicClient, {
    entryPoint,
    kernelVersion,
    plugins: {
      sudo: ownerValidator,
    },
    initConfig: await toInitConfig(permissionValidator),
  });

  return kernelAccount.address;
};

export const resolveAgentSmartAccountAddress = async (testConfig: TestConfig) => {
  if (testConfig.agentSmartAccountAddress) {
    return testConfig.agentSmartAccountAddress;
  }

  const envOverride = process.env.TEST_AGENT_SMART_ACCOUNT_ADDRESS;
  if (envOverride) {
    testConfig.agentSmartAccountAddress = envOverride;
    saveTestConfig(TEST_CONFIG_PATH, testConfig);
    return envOverride;
  }

  if (!process.env.ZERODEV_RPC_URL || !process.env.SMART_ACCOUNT_CHAIN_ID) {
    throw new Error(
      'Missing smart account env vars. Set TEST_AGENT_SMART_ACCOUNT_ADDRESS or ZERODEV_RPC_URL + SMART_ACCOUNT_CHAIN_ID.',
    );
  }

  if (!testConfig.userPkp?.ethAddress) {
    throw new Error('Cannot derive agent smart account without a user PKP address.');
  }

  const chainId = Number(process.env.SMART_ACCOUNT_CHAIN_ID);
  const chain = resolveSmartAccountChain(chainId);
  const ownerAccount = privateKeyToAccount(
    TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`,
  );

  const smartAccountAddress = await deriveZerodevSmartAccountAddress({
    ownerAccount,
    permittedAddress: testConfig.userPkp.ethAddress as Address,
    chain,
  });

  testConfig.agentSmartAccountAddress = smartAccountAddress;
  saveTestConfig(TEST_CONFIG_PATH, testConfig);

  return smartAccountAddress;
};
