import { generatePrivateKey, privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { createPublicClient, http, parseEther, zeroAddress, type Hex } from 'viem';
import { baseSepolia } from 'viem/chains';
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  addressToEmptyAccount,
} from '@zerodev/sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import {
  toPermissionValidator,
  deserializePermissionAccount,
  serializePermissionAccount,
} from '@zerodev/permissions';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';
import { createWalletClient } from 'viem';

import { createVincentViemPkpSigner } from '../src/lib/setup/smart-account/vincentViemPkpSigner';
import { wrapKernelAccountWithUserOpCapture } from '../src/lib/setup/smart-account/wrapKernelAccountWithUserOpCapture';
import { getEnv } from '../src/lib/setup';
import { ensureWalletHasTokens } from '../src/lib/setup/wallets/ensureWalletHasTokens';
import { getCode } from 'viem/actions';

jest.setTimeout(300000);

const BASE_SEPOLIA_RPC_URL = getEnv('BASE_SEPOLIA_RPC_URL', 'https://sepolia.base.org');
const ZERODEV_PROJECT_ID = getEnv('ZERODEV_PROJECT_ID');
const TEST_FUNDER_PRIVATE_KEY = getEnv('TEST_FUNDER_PRIVATE_KEY');

describe('Custom Viem PKP Signer with ZeroDev', () => {
  const chain = baseSepolia;
  const zerodevRpcUrl = `https://rpc.zerodev.app/api/v3/${ZERODEV_PROJECT_ID}/chain/${chain.id}`;
  const publicClient = createPublicClient({
    chain,
    transport: http(BASE_SEPOLIA_RPC_URL),
  });
  const paymasterClient = createZeroDevPaymasterClient({
    chain,
    transport: http(zerodevRpcUrl),
  });

  const funderAccount = privateKeyToAccount(TEST_FUNDER_PRIVATE_KEY as Hex);
  const funderWallet = createWalletClient({
    account: funderAccount,
    chain,
    transport: http(BASE_SEPOLIA_RPC_URL),
  });

  const eoaPrivateKey = generatePrivateKey();
  const eoaAccount = privateKeyToAccount(eoaPrivateKey);

  const mockPkpPrivateKey = generatePrivateKey();
  const mockPkpAccount = privateKeyToAccount(mockPkpPrivateKey);

  const accountIndex = BigInt(Math.floor(Math.random() * 1000000));
  const accountIndex2 = BigInt(Math.floor(Math.random() * 1000000));

  console.table({
    'EOA Address': eoaAccount.address,
    'Mock PKP Address': mockPkpAccount.address,
    'Funder Address': funderAccount.address,
    'Account Index': accountIndex.toString(),
    'Account Index 2': accountIndex2.toString(),
  });

  describe('Full Flow: Deploy with EOA, then add PKP validator', () => {
    const fundAmount = parseEther('0.000000000000000002');
    const sendAmount = parseEther('0.000000000000000001');

    const kernelAccountConfig = {
      entryPoint: getEntryPoint('0.7'),
      kernelVersion: KERNEL_V3_3,
      index: accountIndex2,
    };

    let eoaValidator: any;
    let customPkpSigner: any;
    let pkpEcdsaSigner: any;
    let pkpPermissionValidator: any;
    let kernelAccountEoaOnly: any;
    let kernelClientEoaOnly: any;
    let kernelAccountWithBothValidators: any;
    let serializedPermissionAccount: string;
    let deserializedPermissionAccount: any;
    let kernelClientWithPkp: any;
    let deploymentTxHash: string;
    let sendValueUserOpHash: string;
    let sendValueTxHash: string;

    it('should create EOA ECDSA validator', async () => {
      eoaValidator = await signerToEcdsaValidator(publicClient, {
        entryPoint: getEntryPoint('0.7'),
        signer: eoaAccount,
        kernelVersion: KERNEL_V3_3,
      });
      expect(eoaValidator).toBeDefined();
    });

    it('should create kernel account with only EOA validator', async () => {
      kernelAccountEoaOnly = await createKernelAccount(publicClient, {
        ...kernelAccountConfig,
        plugins: {
          sudo: eoaValidator,
        },
      });

      expect(kernelAccountEoaOnly).toBeDefined();
      expect(kernelAccountEoaOnly.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should deploy smart account using EOA validator', async () => {
      kernelClientEoaOnly = createKernelAccountClient({
        account: kernelAccountEoaOnly,
        chain,
        bundlerTransport: http(zerodevRpcUrl),
        client: publicClient,
        paymaster: {
          getPaymasterData(userOperation) {
            return paymasterClient.sponsorUserOperation({
              userOperation,
            });
          },
        },
      });

      const userOpHash = await kernelClientEoaOnly.sendUserOperation({
        callData: await kernelAccountEoaOnly.encodeCalls([
          {
            to: zeroAddress,
            value: 0n,
            data: '0x' as Hex,
          },
        ]),
      });

      const receipt = await kernelClientEoaOnly.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      deploymentTxHash = receipt.receipt.transactionHash;

      expect(receipt.receipt.status).toBe('success');
      expect(deploymentTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(await getCode(publicClient, { address: kernelAccountEoaOnly.address })).not.toBe('0x');
    });

    // At this point we have a smart account deployed, but it only have the EOA validator

    it('should create PKP permission validator', async () => {
      customPkpSigner = createVincentViemPkpSigner({ privateKey: mockPkpPrivateKey });
      expect(customPkpSigner).toBeDefined();

      pkpEcdsaSigner = await toECDSASigner({
        signer: customPkpSigner,
      });
      expect(pkpEcdsaSigner).toBeDefined();

      pkpPermissionValidator = await toPermissionValidator(publicClient, {
        entryPoint: getEntryPoint('0.7'),
        signer: pkpEcdsaSigner,
        policies: [toSudoPolicy({})],
        kernelVersion: KERNEL_V3_3,
      });
      expect(pkpPermissionValidator).toBeDefined();
    });

    it('should create kernel account with both EOA and PKP validators and serialize permission account', async () => {
      const rawKernelAccount = await createKernelAccount(publicClient, {
        ...kernelAccountConfig,
        plugins: {
          sudo: eoaValidator,
          regular: pkpPermissionValidator,
        },
        address: kernelAccountEoaOnly.address, // This tells Zerodev to not include factory/initCode in UserOps
      });

      kernelAccountWithBothValidators = wrapKernelAccountWithUserOpCapture(
        rawKernelAccount,
        customPkpSigner,
      );

      expect(kernelAccountWithBothValidators).toBeDefined();
      expect(kernelAccountWithBothValidators.address).toBe(kernelAccountEoaOnly.address);

      console.log('[createKernelAccountWithBothValidators] Serializing permission account');
      serializedPermissionAccount = await serializePermissionAccount(
        kernelAccountWithBothValidators,
      );

      expect(serializedPermissionAccount).toBeDefined();
      expect(typeof serializedPermissionAccount).toBe('string');
    });

    it('should deserialize permission account', async () => {
      // Create our custom signer to intercept UserOps
      const pkpEmptyAccountWithCustomSigner = createVincentViemPkpSigner({
        privateKey: mockPkpPrivateKey,
      });

      // Create ECDSA signer from the custom PKP signer
      const pkpEcdsaSignerForDeserialize = await toECDSASigner({
        signer: pkpEmptyAccountWithCustomSigner,
      });

      // Deserialize the permission account using the PKP signer
      const rawDeserializedAccount = await deserializePermissionAccount(
        publicClient,
        getEntryPoint('0.7'),
        KERNEL_V3_3,
        serializedPermissionAccount,
        pkpEcdsaSignerForDeserialize,
      );

      // Wrap the deserialized account to intercept UserOp
      deserializedPermissionAccount = wrapKernelAccountWithUserOpCapture(
        rawDeserializedAccount,
        pkpEmptyAccountWithCustomSigner,
      );

      expect(deserializedPermissionAccount).toBeDefined();
      expect(deserializedPermissionAccount.address).toBe(kernelAccountEoaOnly.address);
    });

    it('should create kernel client with deserialized permission account', async () => {
      kernelClientWithPkp = createKernelAccountClient({
        account: deserializedPermissionAccount,
        chain,
        bundlerTransport: http(zerodevRpcUrl),
        client: publicClient,
        paymaster: {
          getPaymasterData(userOperation) {
            return paymasterClient.sponsorUserOperation({
              userOperation,
            });
          },
        },
      });
      expect(kernelClientWithPkp).toBeDefined();
    });

    it('should fund smart account for send value userOp', async () => {
      const { currentBalance } = await ensureWalletHasTokens({
        address: kernelAccountEoaOnly.address,
        funderWalletClient: funderWallet,
        publicClient: publicClient as any,
        minAmount: fundAmount,
      });

      expect(currentBalance).toBeGreaterThanOrEqual(fundAmount);
    });

    it('should submit userOp using PKP validator', async () => {
      console.log('[should submit userOp using PKP validator] Sending send value userOp');
      sendValueUserOpHash = await kernelClientWithPkp.sendUserOperation({
        callData: await deserializedPermissionAccount.encodeCalls([
          {
            to: funderAccount.address,
            value: sendAmount,
            data: '0x' as Hex,
          },
        ]),
      });

      expect(sendValueUserOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      const receipt = await kernelClientWithPkp.waitForUserOperationReceipt({
        hash: sendValueUserOpHash,
      });

      sendValueTxHash = receipt.receipt.transactionHash;

      expect(receipt.receipt.status).toBe('success');
      expect(sendValueTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should print test summary', () => {
      console.log('Full Flow Test Summary:');
      console.table({
        'EOA Address': eoaAccount.address,
        'Mock PKP Address': mockPkpAccount.address,
        'Smart Account Address': kernelAccountEoaOnly.address,
        'Account Index': accountIndex2.toString(),
        'Deployment Tx Hash': deploymentTxHash,
        'UserOp Hash (PKP)': sendValueUserOpHash,
        'Transaction Hash (PKP)': sendValueTxHash,
        Chain: `${chain.name} (${chain.id})`,
      });

      expect(true).toBe(true);
    });
  });
});
