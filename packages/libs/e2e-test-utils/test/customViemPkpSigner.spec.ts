import type { Hex } from 'viem';

import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import {
  toPermissionValidator,
  deserializePermissionAccount,
  serializePermissionAccount,
} from '@zerodev/permissions';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { toECDSASigner } from '@zerodev/permissions/signers';
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from '@zerodev/sdk';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';
import { createPublicClient, http, parseEther, zeroAddress, createWalletClient } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { getCode } from 'viem/actions';
import { baseSepolia } from 'viem/chains';

import {
  createVincentViemPkpSigner,
  wrapKernelAccountWithUserOpCapture,
} from '@lit-protocol/vincent-app-sdk/utils';

import { ensureWalletHasTokens, getEnv } from '../src';

jest.setTimeout(300000);

const BASE_SEPOLIA_RPC_URL = getEnv('BASE_SEPOLIA_RPC_URL', 'https://sepolia.base.org');
const ZERODEV_PROJECT_ID = getEnv('ZERODEV_PROJECT_ID');
const TEST_FUNDER_PRIVATE_KEY = getEnv('TEST_FUNDER_PRIVATE_KEY');

/**
 * E2E test for custom Viem PKP signer integration with ZeroDev smart accounts
 *
 * This test validates the full lifecycle of a multi-validator smart account setup where a PKP can sign
 * transactions remotely (via a Lit Action) while maintaining the security model of ERC-4337 account abstraction.
 *
 * Test Flow:
 * 1. Deploy smart account with EOA validator
 *    - Creates a kernel account (ZeroDev) with only an EOA as the sudo validator
 *    - Deploys the account on-chain via a UserOperation
 *
 * 2. Add PKP validator to existing account
 *    - Creates a custom PKP signer that intercepts and captures UserOps before signing
 *    - Wraps the PKP as an ECDSA signer with permission policies (sudo policy)
 *    - Creates a kernel account with BOTH validators: EOA (sudo) + PKP (regular)
 *    - Serializes the permission account for persistence/transfer
 *
 * 3. Deserialize and use PKP validator
 *    - Deserializes the permission account using the PKP signer
 *    - Creates a kernel client using only the PKP validator
 *    - Submits a UserOperation (send value tx) signed by the PKP
 *    - Validates the transaction executes successfully
 *
 */
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
      customPkpSigner = createVincentViemPkpSigner({
        pkpAddress: mockPkpAccount.address,
        onSignUserOpHash: async ({ userOpHash }) => {
          // In a real implementation, this would call a Lit Action to sign with the PKP
          // For this test, we'll sign directly with the mock PKP private key
          const message = { raw: userOpHash };
          return mockPkpAccount.signMessage({ message });
        },
      });
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
        pkpAddress: mockPkpAccount.address,
        onSignUserOpHash: async ({ userOpHash }) => {
          // In a real implementation, this would call a Lit Action to sign with the PKP
          // For this test, we'll sign directly with the mock PKP private key
          const message = { raw: userOpHash };
          return mockPkpAccount.signMessage({ message });
        },
      });

      // Create ECDSA signer from the custom PKP signer
      const pkpEcdsaSignerForDeserialize = await toECDSASigner({
        signer: pkpEmptyAccountWithCustomSigner as any,
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
