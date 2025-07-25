import { ethers } from 'ethers';
import { bundledVincentTool } from '@lit-protocol/vincent-tool-transaction-signer';
import { vincentPolicyMetadata } from '@lit-protocol/vincent-policy-contract-whitelist';
import {
  disconnectVincentToolClients,
  getVincentToolClient,
} from '@lit-protocol/vincent-app-sdk/toolClient';
import {
  validateToolExecutionAndGetPolicies,
  type PermissionData,
} from '@lit-protocol/vincent-contracts-sdk';
import { formatEther, parseUnits, PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as util from 'node:util';

import {
  BASE_PUBLIC_CLIENT,
  BASE_RPC_URL,
  checkShouldMintAndFundPkp,
  DATIL_PUBLIC_CLIENT,
  ETH_PUBLIC_CLIENT,
  ETH_RPC_URL,
  getTestConfig,
  TEST_APP_DELEGATEE_ACCOUNT,
  TEST_APP_DELEGATEE_PRIVATE_KEY,
  TEST_APP_MANAGER_PRIVATE_KEY,
  TEST_CONFIG_PATH,
  TestConfig,
  YELLOWSTONE_RPC_URL,
} from './helpers';
import { checkShouldMintCapacityCredit } from './helpers/check-mint-capcity-credit';
import {
  fundAppDelegateeIfNeeded,
  permitAppVersionForAgentWalletPkp,
  permitToolsForAgentWalletPkp,
  registerNewApp,
  removeAppDelegateeIfNeeded,
} from './helpers/setup-fixtures';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

// Create a delegatee wallet for tool execution
const getDelegateeWallet = () => {
  return new ethers.Wallet(
    TEST_APP_DELEGATEE_PRIVATE_KEY as string,
    new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
  );
};

const getTransactionSignerToolClient = () => {
  return getVincentToolClient({
    bundledVincentTool: bundledVincentTool,
    ethersSigner: getDelegateeWallet(),
  });
};

describe('Contract Whitelist Tool E2E Tests', () => {
  const BASE_WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
  const ETH_WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

  // Define permission data for all tools and policies
  const PERMISSION_DATA: PermissionData = {
    // Transaction Signer Tool has the Contract Whitelist Policy
    [bundledVincentTool.ipfsCid]: {
      [vincentPolicyMetadata.ipfsCid]: {
        whitelist: {
          // Ethereum Mainnet
          '1': {
            [ETH_WETH_ADDRESS]: {
              functionSelectors: ['*'],
            },
          },
          // Base Mainnet
          '8453': {
            [BASE_WETH_ADDRESS]: {
              functionSelectors: [ethers.utils.id('transfer(address,uint256)').slice(0, 10)],
            },
          },
        },
      },
    },
  };

  // An array of the IPFS cid of each tool to be tested, computed from the keys of PERMISSION_DATA
  const TOOL_IPFS_IDS: string[] = Object.keys(PERMISSION_DATA);

  // Define the policies for each tool, computed from TOOL_IPFS_IDS and PERMISSION_DATA
  const TOOL_POLICIES = TOOL_IPFS_IDS.map((toolIpfsCid) => {
    // Get the policy IPFS CIDs for this tool from PERMISSION_DATA
    return Object.keys(PERMISSION_DATA[toolIpfsCid]);
  });

  const providerBase = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);

  let TEST_CONFIG: TestConfig;
  type RawTransaction = {
    to: string;
    value: string;
    data: string;
    chainId: number;
    nonce: number;
    gasPrice?: string;
    gasLimit: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    type?: number;
  };
  let RAW_ERC20_TRANSFER_TRANSACTION_ON_BASE: RawTransaction;
  let RAW_ERC20_TRANSFER_TRANSACTION_ON_ETH: RawTransaction;

  let SIGNED_ERC20_TRANSFER_TRANSACTION_ON_BASE: string;
  let SIGNED_ERC20_TRANSFER_FROM_TRANSACTION_ON_BASE: string;
  let SIGNED_ERC20_TRANSFER_TRANSACTION_ON_ETH: string;

  // EIP-1559 transaction variables
  let RAW_EIP1559_ERC20_TRANSFER_TRANSACTION_ON_BASE: RawTransaction;
  let SIGNED_EIP1559_ERC20_TRANSFER_TRANSACTION_ON_BASE: string;

  afterAll(async () => {
    console.log('Disconnecting from Lit node client...');
    await disconnectVincentToolClients();
  });

  beforeAll(async () => {
    TEST_CONFIG = getTestConfig(TEST_CONFIG_PATH);
    TEST_CONFIG = await checkShouldMintAndFundPkp(TEST_CONFIG);
    TEST_CONFIG = await checkShouldMintCapacityCredit(TEST_CONFIG);

    // The Agent Wallet PKP needs to have Base ETH and WETH
    // in order to execute the WETH transfer transaction after the
    // Transaction Signer Tool signs the transaction
    const agentWalletPkpBaseEthBalance = await BASE_PUBLIC_CLIENT.getBalance({
      address: TEST_CONFIG.userPkp!.ethAddress! as `0x${string}`,
    });
    if (agentWalletPkpBaseEthBalance === 0n) {
      throw new Error(
        `❌ Agent Wallet PKP has no Base ETH. Please fund ${TEST_CONFIG.userPkp!.ethAddress!} with Base ETH`,
      );
    } else {
      console.log(`ℹ️  Agent Wallet PKP has ${formatEther(agentWalletPkpBaseEthBalance)} Base ETH`);
    }

    const agentWalletPkpBaseWethBalance = await BASE_PUBLIC_CLIENT.getBalance({
      address: TEST_CONFIG.userPkp!.ethAddress! as `0x${string}`,
    });
    if (agentWalletPkpBaseWethBalance === 0n) {
      throw new Error(
        `❌ Agent Wallet PKP has no Base WETH. Please fund ${TEST_CONFIG.userPkp!.ethAddress!} with Base WETH`,
      );
    } else {
      console.log(
        `ℹ️  Agent Wallet PKP has ${formatEther(agentWalletPkpBaseWethBalance)} Base WETH`,
      );
    }

    // The Agent Wallet PKP needs to have ETH Mainnet ETH and WETH
    // in order to execute the WETH transfer transaction after the
    // Transaction Signer Tool signs the transaction
    const agentWalletPkpEthMainnetEthBalance = await ETH_PUBLIC_CLIENT.getBalance({
      address: TEST_CONFIG.userPkp!.ethAddress! as `0x${string}`,
    });
    if (agentWalletPkpEthMainnetEthBalance === 0n) {
      throw new Error(
        `❌ Agent Wallet PKP has no ETH Mainnet ETH. Please fund ${TEST_CONFIG.userPkp!.ethAddress!} with ETH Mainnet ETH`,
      );
    } else {
      console.log(
        `ℹ️  Agent Wallet PKP has ${formatEther(agentWalletPkpEthMainnetEthBalance)} ETH Mainnet ETH`,
      );
    }

    const agentWalletPkpEthMainnetWethBalance = await ETH_PUBLIC_CLIENT.getBalance({
      address: TEST_CONFIG.userPkp!.ethAddress! as `0x${string}`,
    });
    if (agentWalletPkpEthMainnetWethBalance === 0n) {
      throw new Error(
        `❌ Agent Wallet PKP has no ETH Mainnet WETH. Please fund ${TEST_CONFIG.userPkp!.ethAddress!} with ETH Mainnet WETH`,
      );
    } else {
      console.log(
        `ℹ️  Agent Wallet PKP has ${formatEther(agentWalletPkpEthMainnetWethBalance)} ETH Mainnet WETH`,
      );
    }

    // The App Manager needs to have Lit test tokens
    // in order to interact with the Vincent contract
    const appManagerLitTestTokenBalance = await DATIL_PUBLIC_CLIENT.getBalance({
      address: privateKeyToAccount(TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`).address,
    });
    if (appManagerLitTestTokenBalance === 0n) {
      throw new Error(
        `❌ App Manager has no Lit test tokens. Please fund ${
          privateKeyToAccount(TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`).address
        } with Lit test tokens`,
      );
    } else {
      console.log(
        `ℹ️  App Manager has ${formatEther(appManagerLitTestTokenBalance)} Lit test tokens`,
      );
    }

    // ERC20 transfer function signature: transfer(address,uint256)
    const erc20Interface = new ethers.utils.Interface([
      'function transfer(address to, uint256 value) public returns (bool)',
    ]);

    // Create the transaction data
    const transactionData = erc20Interface.encodeFunctionData(
      'transfer',
      [TEST_APP_DELEGATEE_ACCOUNT.address, ethers.utils.parseUnits('0.0000077', 18)], // 0.0000077 WETH
    );

    const erc20TransferTransactionBase = {
      from: TEST_CONFIG.userPkp!.ethAddress!,
      to: BASE_WETH_ADDRESS,
      value: '0x00',
      data: transactionData,
    };

    // Estimate gas limit for the transaction
    const estimatedGasLimitBase = await providerBase.estimateGas(erc20TransferTransactionBase);

    // Add a 5% buffer to the estimated gas
    const gasLimitBase = estimatedGasLimitBase.mul(105).div(100);

    // Create the transaction object (without nonce - will be set dynamically)
    RAW_ERC20_TRANSFER_TRANSACTION_ON_BASE = {
      to: erc20TransferTransactionBase.to,
      value: erc20TransferTransactionBase.value,
      data: erc20TransferTransactionBase.data,
      chainId: 8453, // Base Mainnet
      nonce: 0, // Will be set dynamically
      gasPrice: (await providerBase.getGasPrice()).toHexString(),
      gasLimit: gasLimitBase.toHexString(),
    };

    // Serialization will be done dynamically with fresh nonce

    // Get the current nonce for the PKP address
    const providerEth = new ethers.providers.JsonRpcProvider(ETH_RPC_URL);

    const erc20TransferTransactionEth = {
      from: TEST_CONFIG.userPkp!.ethAddress!,
      to: ETH_WETH_ADDRESS,
      value: '0x00',
      data: transactionData,
    };

    // Estimate gas limit for the transaction
    const estimatedGasLimitEth = await providerEth.estimateGas(erc20TransferTransactionEth);

    // Add a 5% buffer to the estimated gas
    const gasLimitEth = estimatedGasLimitEth.mul(105).div(100);

    // Create the transaction object (without nonce - will be set dynamically)
    RAW_ERC20_TRANSFER_TRANSACTION_ON_ETH = {
      to: erc20TransferTransactionEth.to,
      value: erc20TransferTransactionEth.value,
      data: erc20TransferTransactionEth.data,
      chainId: 1, // ETH Mainnet
      nonce: 0, // Will be set dynamically
      gasPrice: (await providerEth.getGasPrice()).toHexString(),
      gasLimit: gasLimitEth.toHexString(),
    };

    // Serialization will be done dynamically with fresh nonce

    // Create EIP-1559 (Type 2) transaction for Base
    const feeData = await providerBase.getFeeData();

    // Create the EIP-1559 transaction object (without nonce - will be set dynamically)
    RAW_EIP1559_ERC20_TRANSFER_TRANSACTION_ON_BASE = {
      to: erc20TransferTransactionBase.to,
      value: erc20TransferTransactionBase.value,
      data: erc20TransferTransactionBase.data,
      chainId: 8453, // Base Mainnet
      nonce: 0, // Will be set dynamically
      gasLimit: gasLimitBase.toHexString(),
      maxFeePerGas: feeData.maxFeePerGas!.toHexString(),
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas!.toHexString(),
      type: 2, // EIP-1559 transaction type
    };

    // Serialization will be done dynamically with fresh nonce
  });

  // Contract Whitelist Policy doesn't need to be permitted because it doesn't sign anything
  it('should permit the Transaction Signer Tool for the Agent Wallet PKP', async () => {
    await permitToolsForAgentWalletPkp([bundledVincentTool.ipfsCid], TEST_CONFIG);
  });

  it('should remove TEST_APP_DELEGATEE_ACCOUNT from an existing App if needed', async () => {
    await removeAppDelegateeIfNeeded();
  });

  it('should register a new App', async () => {
    TEST_CONFIG = await registerNewApp(TOOL_IPFS_IDS, TOOL_POLICIES, TEST_CONFIG, TEST_CONFIG_PATH);
  });

  it('should permit the App version for the Agent Wallet PKP', async () => {
    await permitAppVersionForAgentWalletPkp(PERMISSION_DATA, TEST_CONFIG);
  });

  it('should validate the Delegatee has permission to execute the Transaction Signer Tool with the Agent Wallet PKP', async () => {
    const validationResult = await validateToolExecutionAndGetPolicies({
      signer: new ethers.Wallet(
        TEST_APP_MANAGER_PRIVATE_KEY,
        new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
      ),
      args: {
        delegateeAddress: TEST_APP_DELEGATEE_ACCOUNT.address,
        pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        toolIpfsCid: TOOL_IPFS_IDS[0],
      },
    });

    expect(validationResult).toBeDefined();
    expect(validationResult.isPermitted).toBe(true);
    expect(validationResult.appId).toBe(TEST_CONFIG.appId!);
    expect(validationResult.appVersion).toBe(TEST_CONFIG.appVersion!);

    // Check that we have the contract whitelist policy
    expect(Object.keys(validationResult.decodedPolicies)).toContain(vincentPolicyMetadata.ipfsCid);

    // Check the policy parameters
    const policyParams = validationResult.decodedPolicies[vincentPolicyMetadata.ipfsCid];
    expect(policyParams).toBeDefined();
    expect(policyParams?.whitelist).toBeDefined();

    expect(policyParams?.whitelist?.[1]?.[ETH_WETH_ADDRESS]?.functionSelectors).toBeDefined();
    expect(policyParams?.whitelist?.[1]?.[ETH_WETH_ADDRESS]?.functionSelectors).toHaveLength(1);
    expect(policyParams?.whitelist?.[1]?.[ETH_WETH_ADDRESS]?.functionSelectors).toContain('*');

    expect(policyParams?.whitelist?.[8453]?.[BASE_WETH_ADDRESS]?.functionSelectors).toBeDefined();
    expect(policyParams?.whitelist?.[8453]?.[BASE_WETH_ADDRESS]?.functionSelectors).toHaveLength(1);
    expect(policyParams?.whitelist?.[8453]?.[BASE_WETH_ADDRESS]?.functionSelectors).toContain(
      ethers.utils.id('transfer(address,uint256)').slice(0, 10),
    );
  });

  it('should fund TEST_APP_DELEGATEE if they have no Lit test tokens', async () => {
    await fundAppDelegateeIfNeeded();
  });

  // Helper function to create serialized transaction with fresh nonce
  const createSerializedTransaction = async (
    rawTransaction: RawTransaction,
  ): Promise<{ serializedTransaction: string; updatedRawTransaction: RawTransaction }> => {
    const provider =
      rawTransaction.chainId === 8453
        ? new ethers.providers.JsonRpcProvider(BASE_RPC_URL)
        : new ethers.providers.JsonRpcProvider(ETH_RPC_URL);

    const currentNonce = await provider.getTransactionCount(TEST_CONFIG.userPkp!.ethAddress!);

    const updatedRawTransaction = {
      ...rawTransaction,
      nonce: currentNonce,
    };

    const serializedTransaction = ethers.utils.serializeTransaction(updatedRawTransaction);

    return { serializedTransaction, updatedRawTransaction };
  };

  const testPrecheck = async (rawTransaction: RawTransaction) => {
    // Create serialized transaction with fresh nonce
    const { serializedTransaction, updatedRawTransaction } =
      await createSerializedTransaction(rawTransaction);

    // Test: Run precheck on Transaction Signer Tool
    const transactionSignerToolClient = getTransactionSignerToolClient();

    // Call the precheck method with the serialized transaction
    const precheckResult = await transactionSignerToolClient.precheck(
      {
        serializedTransaction,
      },
      {
        delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      },
    );

    // Verify the precheck was successful
    expect(precheckResult).toBeDefined();
    console.log('precheckResult', util.inspect(precheckResult, { depth: 10 }));
    expect(precheckResult.success).toBe(true);

    if (precheckResult.success === false) {
      // A bit redundant, but typescript doesn't understand `expect().toBe(true)` is narrowing to the type.
      throw new Error(precheckResult.runtimeError);
    }

    // Verify the context is properly populated
    expect(precheckResult.context).toBeDefined();
    expect(precheckResult.context?.delegation.delegateeAddress).toBeDefined();
    expect(precheckResult.context?.delegation.delegatorPkpInfo.ethAddress).toBe(
      TEST_CONFIG.userPkp!.ethAddress!,
    );

    // Verify policies context
    expect(precheckResult.context?.policiesContext).toBeDefined();
    expect(precheckResult.context?.policiesContext.allow).toBe(true);
    expect(precheckResult.context?.policiesContext.evaluatedPolicies).toContain(
      '@lit-protocol/vincent-policy-contract-whitelist',
    );

    // The tool precheck should return the deserialized transaction
    expect(precheckResult.result).toBeDefined();
    const deserializedUnsignedTransaction = precheckResult.result?.deserializedUnsignedTransaction;
    expect(deserializedUnsignedTransaction.to).toBe(updatedRawTransaction.to);
    expect(deserializedUnsignedTransaction.value).toBe('0x00');
    expect(deserializedUnsignedTransaction.data).toBe(updatedRawTransaction.data);
    expect(deserializedUnsignedTransaction.chainId).toBe(updatedRawTransaction.chainId);
    expect(deserializedUnsignedTransaction.nonce).toBe(updatedRawTransaction.nonce);
    expect(deserializedUnsignedTransaction.gasLimit).toBe(updatedRawTransaction.gasLimit);

    // Handle different gas pricing mechanisms
    if (updatedRawTransaction.type === 2) {
      // EIP-1559 transaction
      expect(deserializedUnsignedTransaction.maxFeePerGas).toBe(updatedRawTransaction.maxFeePerGas);
      expect(deserializedUnsignedTransaction.maxPriorityFeePerGas).toBe(
        updatedRawTransaction.maxPriorityFeePerGas,
      );
      expect(deserializedUnsignedTransaction.type).toBe(2);
    } else {
      // Legacy transaction
      expect(deserializedUnsignedTransaction.gasPrice).toBe(updatedRawTransaction.gasPrice);
    }

    // The policy precheck should return the permitted chainId, contractAddress, and functionSelector
    const policyPrecheckResult = (precheckResult.context?.policiesContext.allowedPolicies as any)?.[
      '@lit-protocol/vincent-policy-contract-whitelist'
    ]?.result as { chainId: number; contractAddress: string; functionSelector: string };
    expect(policyPrecheckResult).toBeDefined();
    expect(policyPrecheckResult?.chainId).toBe(updatedRawTransaction.chainId);
    expect(policyPrecheckResult?.contractAddress).toBe(updatedRawTransaction.to);
    expect(policyPrecheckResult?.functionSelector).toBe(updatedRawTransaction.data.slice(0, 10));
  };

  const testExecute = async (rawTransaction: RawTransaction) => {
    // Create serialized transaction with fresh nonce
    const { serializedTransaction, updatedRawTransaction } =
      await createSerializedTransaction(rawTransaction);

    const transactionSignerToolClient = getTransactionSignerToolClient();

    const executeResult = await transactionSignerToolClient.execute(
      {
        serializedTransaction,
      },
      {
        delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      },
    );
    console.log('executeResult', util.inspect(executeResult, { depth: 10 }));

    // Assert the executeResult structure and values
    expect(executeResult).toBeDefined();
    expect(executeResult.success).toBe(true);

    // Check result object
    expect(executeResult.result).toBeDefined();

    if (!executeResult.success || !executeResult.result || 'error' in executeResult.result) {
      throw new Error('Execute failed or returned error');
    }

    // The signed transaction will change every run, so just check it's a non-empty string
    // Parse and validate the signed transaction
    const signedTxHex = executeResult.result.signedTransaction;
    expect(typeof signedTxHex).toBe('string');
    expect(signedTxHex).toMatch(/^0x[0-9a-fA-F]+$/);

    // Parse the signed transaction to validate its structure
    const parsedSignedTx = ethers.utils.parseTransaction(signedTxHex);
    expect(parsedSignedTx).toBeDefined();
    expect(parsedSignedTx.hash).toBeDefined();
    expect(parsedSignedTx.from?.toLowerCase()).toBe(TEST_CONFIG.userPkp!.ethAddress!.toLowerCase());
    expect(parsedSignedTx.to?.toLowerCase()).toBe(updatedRawTransaction.to.toLowerCase());
    expect(parsedSignedTx.nonce).toBe(updatedRawTransaction.nonce);
    expect(parsedSignedTx.gasLimit.toHexString()).toBe(updatedRawTransaction.gasLimit);

    // Handle different gas pricing mechanisms
    if (updatedRawTransaction.type === 2) {
      // EIP-1559 transaction
      expect(parsedSignedTx.maxFeePerGas?.toHexString()).toBe(updatedRawTransaction.maxFeePerGas);
      expect(parsedSignedTx.maxPriorityFeePerGas?.toHexString()).toBe(
        updatedRawTransaction.maxPriorityFeePerGas,
      );
      expect(parsedSignedTx.type).toBe(2);
    } else {
      // Legacy transaction
      expect(parsedSignedTx.gasPrice?.toHexString()).toBe(updatedRawTransaction.gasPrice);
    }

    expect(parsedSignedTx.data).toBe(updatedRawTransaction.data);
    expect(parsedSignedTx.value.toHexString()).toBe(updatedRawTransaction.value);
    expect(parsedSignedTx.chainId).toBe(updatedRawTransaction.chainId);
    expect(parsedSignedTx.v).toBeDefined();
    expect(parsedSignedTx.r).toBeDefined();
    expect(parsedSignedTx.s).toBeDefined();

    const deserializedSignedTransaction = executeResult.result.deserializedSignedTransaction;
    expect(deserializedSignedTransaction).toBeDefined();

    // Check fields that should match the input transaction
    expect(deserializedSignedTransaction.to).toBe(updatedRawTransaction.to);
    expect(deserializedSignedTransaction.value).toBe(updatedRawTransaction.value);
    expect(deserializedSignedTransaction.data).toBe(updatedRawTransaction.data);
    expect(deserializedSignedTransaction.chainId).toBe(updatedRawTransaction.chainId);
    expect(deserializedSignedTransaction.nonce).toBe(updatedRawTransaction.nonce);
    expect(deserializedSignedTransaction.gasLimit).toBe(updatedRawTransaction.gasLimit);

    // Handle different gas pricing mechanisms for deserialized transaction
    if (updatedRawTransaction.type === 2) {
      // EIP-1559 transaction
      expect(deserializedSignedTransaction.maxFeePerGas).toBe(updatedRawTransaction.maxFeePerGas);
      expect(deserializedSignedTransaction.maxPriorityFeePerGas).toBe(
        updatedRawTransaction.maxPriorityFeePerGas,
      );
      expect(deserializedSignedTransaction.type).toBe(2);
      expect(deserializedSignedTransaction.gasPrice).toBeNull(); // gasPrice should be null for EIP-1559
    } else {
      // Legacy transaction
      expect(deserializedSignedTransaction.gasPrice).toBe(updatedRawTransaction.gasPrice);
    }

    // The 'from' address should be the PKP's eth address
    expect(deserializedSignedTransaction.from?.toLowerCase()).toBe(
      TEST_CONFIG.userPkp!.ethAddress!.toLowerCase(),
    );

    // Validate signature components using parsed transaction
    expect(parsedSignedTx.hash).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(typeof parsedSignedTx.v).toBe('number');
    expect(parsedSignedTx.r).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(parsedSignedTx.s).toMatch(/^0x[0-9a-fA-F]{64}$/);

    // Validate that the parsed transaction matches the deserialized one
    expect(parsedSignedTx.hash).toBe(deserializedSignedTransaction.hash);
    expect(parsedSignedTx.v).toBe(deserializedSignedTransaction.v);
    expect(parsedSignedTx.r).toBe(deserializedSignedTransaction.r);
    expect(parsedSignedTx.s).toBe(deserializedSignedTransaction.s);

    // Check policiesContext
    const policiesContext = executeResult.context?.policiesContext;
    expect(policiesContext).toBeDefined();
    expect(policiesContext!.allow).toBe(true);
    expect(policiesContext!.evaluatedPolicies).toContain(
      '@lit-protocol/vincent-policy-contract-whitelist',
    );
    expect(policiesContext!.allowedPolicies).toBeDefined();

    const allowedPolicy =
      policiesContext!.allowedPolicies!['@lit-protocol/vincent-policy-contract-whitelist']!;
    expect(allowedPolicy).toBeDefined();
    expect(allowedPolicy.result).toBeDefined();
    expect(allowedPolicy.result.chainId).toBe(updatedRawTransaction.chainId);
    expect(allowedPolicy.result.contractAddress.toLowerCase()).toBe(
      updatedRawTransaction.to.toLowerCase(),
    );
    expect(allowedPolicy.result.functionSelector).toBe(updatedRawTransaction.data.slice(0, 10));

    // Store the signed transaction for the next test
    return signedTxHex;
  };

  const testSend = async (
    signedTransaction: string,
    viemPublicClient: PublicClient,
    wethAddress: string,
  ) => {
    const wethAbi = [
      {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function',
      },
    ];

    // Get initial WETH balance of delegatee
    const initialDelegateeWethBalance = (await viemPublicClient.readContract({
      address: wethAddress as `0x${string}`,
      abi: wethAbi,
      functionName: 'balanceOf',
      args: [TEST_APP_DELEGATEE_ACCOUNT.address],
    })) as bigint;

    // Send the signed transaction to Base Mainnet
    const txHash = await viemPublicClient.sendRawTransaction({
      serializedTransaction: signedTransaction as `0x${string}`,
    });

    console.log(`Transaction sent with hash: ${txHash}`);

    // Wait for transaction to be mined
    const receipt = await viemPublicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    expect(receipt.status).toBe('success');
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    // Wait for the next block to be mined to ensure state changes are reflected
    const currentBlock = await viemPublicClient.getBlockNumber();
    console.log(`Waiting for next block after ${currentBlock}...`);

    await new Promise<void>((resolve) => {
      const unwatch = viemPublicClient.watchBlockNumber({
        onBlockNumber: (blockNumber) => {
          if (blockNumber > currentBlock) {
            console.log(`New block mined: ${blockNumber}`);
            unwatch();
            resolve();
          }
        },
      });
    });

    // Verify the delegatee received the WETH transfer
    const finalDelegateeWethBalance = (await viemPublicClient.readContract({
      address: wethAddress as `0x${string}`,
      abi: wethAbi,
      functionName: 'balanceOf',
      args: [TEST_APP_DELEGATEE_ACCOUNT.address],
    })) as bigint;

    console.log(`Recipient WETH balance before: ${formatEther(initialDelegateeWethBalance)} WETH`);
    console.log(`Recipient WETH balance after: ${formatEther(finalDelegateeWethBalance)} WETH`);

    const expectedIncrease = parseUnits('0.0000077', 18);
    const actualIncrease = finalDelegateeWethBalance - initialDelegateeWethBalance;

    expect(actualIncrease).toBe(expectedIncrease);
    console.log(`WETH transfer successful: ${formatEther(actualIncrease)} WETH transferred`);
  };

  it('should successfully run precheck on the Transaction Signer Tool for Base Mainnet', async () => {
    await testPrecheck(RAW_ERC20_TRANSFER_TRANSACTION_ON_BASE);
  });

  it('should execute the Transaction Signer Tool with the Agent Wallet PKP for Base Mainnet', async () => {
    // Store the signed transaction for the next test
    SIGNED_ERC20_TRANSFER_TRANSACTION_ON_BASE = await testExecute(
      RAW_ERC20_TRANSFER_TRANSACTION_ON_BASE,
    );
  });

  it('should send the signed transaction on Base Mainnet to transfer WETH to the delegatee', async () => {
    await testSend(
      SIGNED_ERC20_TRANSFER_TRANSACTION_ON_BASE,
      BASE_PUBLIC_CLIENT,
      BASE_WETH_ADDRESS,
    );
  });

  it('should successfully run precheck on the Transaction Signer Tool for ETH Mainnet', async () => {
    await testPrecheck(RAW_ERC20_TRANSFER_TRANSACTION_ON_ETH);
  });

  it('should execute the Transaction Signer Tool with the Agent Wallet PKP for ETH Mainnet', async () => {
    // Store the signed transaction for the next test
    SIGNED_ERC20_TRANSFER_TRANSACTION_ON_ETH = await testExecute(
      RAW_ERC20_TRANSFER_TRANSACTION_ON_ETH,
    );
  });

  it('should send the signed transaction on ETH Mainnet to transfer WETH to the delegatee', async () => {
    await testSend(SIGNED_ERC20_TRANSFER_TRANSACTION_ON_ETH, ETH_PUBLIC_CLIENT, ETH_WETH_ADDRESS);
  });

  const getSerializedERC20TransferFromTransactionOnBase = async () => {
    const providerBase = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);

    // ERC20 transfer function signature: transfer(address,uint256)
    const erc20Interface = new ethers.utils.Interface([
      'function transferFrom(address from, address to, uint256 value) public returns (bool)',
    ]);

    // Create the transaction data
    const transactionData = erc20Interface.encodeFunctionData(
      'transferFrom',
      [
        TEST_CONFIG.userPkp!.ethAddress!,
        TEST_APP_DELEGATEE_ACCOUNT.address,
        ethers.utils.parseUnits('0.0000077', 18),
      ], // 0.0000077 WETH
    );

    const erc20TransferFromTransactionBase = {
      from: TEST_CONFIG.userPkp!.ethAddress!,
      to: BASE_WETH_ADDRESS,
      value: '0x00',
      data: transactionData,
    };

    // Estimate gas limit for the transaction
    const estimatedGasLimitBase = await providerBase.estimateGas(erc20TransferFromTransactionBase);

    // Add a 5% buffer to the estimated gas
    const gasLimitBase = estimatedGasLimitBase.mul(105).div(100);

    // Create the transaction object
    const RAW_ERC20_TRANSFER_FROM_TRANSACTION_ON_BASE = {
      to: erc20TransferFromTransactionBase.to,
      value: erc20TransferFromTransactionBase.value,
      data: erc20TransferFromTransactionBase.data,
      chainId: 8453, // Base Mainnet
      nonce: await providerBase.getTransactionCount(TEST_CONFIG.userPkp!.ethAddress!),
      gasPrice: (await providerBase.getGasPrice()).toHexString(),
      gasLimit: gasLimitBase.toHexString(),
    };

    return RAW_ERC20_TRANSFER_FROM_TRANSACTION_ON_BASE;
  };

  it('should fail precheck because the function selector is not whitelisted', async () => {
    const rawTransaction = await getSerializedERC20TransferFromTransactionOnBase();

    // Create serialized transaction with fresh nonce
    const { serializedTransaction, updatedRawTransaction } =
      await createSerializedTransaction(rawTransaction);

    // Test: Run precheck on Transaction Signer Tool
    const transactionSignerToolClient = getTransactionSignerToolClient();

    // Call the precheck method with the serialized transaction
    const precheckResult = await transactionSignerToolClient.precheck(
      {
        serializedTransaction,
      },
      {
        delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      },
    );

    // Verify the precheck was successful
    expect(precheckResult).toBeDefined();
    console.log('precheckResult', util.inspect(precheckResult, { depth: 10 }));
    expect(precheckResult.success).toBe(true);

    if (precheckResult.success === false) {
      throw new Error(precheckResult.runtimeError);
    }

    // Verify the context is properly populated
    expect(precheckResult.context).toBeDefined();
    expect(precheckResult.context?.delegation.delegateeAddress).toBeDefined();
    expect(precheckResult.context?.delegation.delegatorPkpInfo.ethAddress).toBe(
      TEST_CONFIG.userPkp!.ethAddress!,
    );

    // Verify policies context shows the transaction was denied
    expect(precheckResult.context?.policiesContext).toBeDefined();
    expect(precheckResult.context?.policiesContext.allow).toBe(false);
    expect(precheckResult.context?.policiesContext.evaluatedPolicies).toContain(
      '@lit-protocol/vincent-policy-contract-whitelist',
    );

    // Verify the denied policy details
    expect(precheckResult.context?.policiesContext.deniedPolicy).toBeDefined();
    expect(precheckResult.context?.policiesContext.deniedPolicy?.packageName).toBe(
      '@lit-protocol/vincent-policy-contract-whitelist',
    );

    const deniedPolicy = precheckResult.context?.policiesContext.deniedPolicy;
    expect(deniedPolicy?.result).toBeDefined();
    expect(deniedPolicy?.result?.reason).toBe('Function selector not whitelisted');
    expect(deniedPolicy?.result?.chainId).toBe(8453);
    expect(deniedPolicy?.result?.contractAddress).toBe(BASE_WETH_ADDRESS);
    expect(deniedPolicy?.result?.functionSelector).toBe(
      ethers.utils.id('transferFrom(address,address,uint256)').slice(0, 10),
    );

    // The tool precheck should still return the deserialized transaction
    expect(precheckResult.result).toBeDefined();
    const deserializedUnsignedTransaction = precheckResult.result?.deserializedUnsignedTransaction;
    expect(deserializedUnsignedTransaction.to).toBe(updatedRawTransaction.to);
    expect(deserializedUnsignedTransaction.value).toBe('0x00');
    expect(deserializedUnsignedTransaction.data).toBe(updatedRawTransaction.data);
    expect(deserializedUnsignedTransaction.chainId).toBe(updatedRawTransaction.chainId);
    expect(deserializedUnsignedTransaction.nonce).toBe(updatedRawTransaction.nonce);
    expect(deserializedUnsignedTransaction.gasPrice).toBe(updatedRawTransaction.gasPrice);
    expect(deserializedUnsignedTransaction.gasLimit).toBe(updatedRawTransaction.gasLimit);
  });

  it('should fail execute because the function selector is not whitelisted', async () => {
    const rawTransaction = await getSerializedERC20TransferFromTransactionOnBase();

    // Create serialized transaction with fresh nonce
    const { serializedTransaction } = await createSerializedTransaction(rawTransaction);

    // Test: Run precheck on Transaction Signer Tool
    const transactionSignerToolClient = getTransactionSignerToolClient();

    // Call the precheck method with the serialized transaction
    const executeResult = await transactionSignerToolClient.execute(
      {
        serializedTransaction,
      },
      {
        delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      },
    );

    // Verify the execute was successful
    expect(executeResult).toBeDefined();
    console.log('executeResult', util.inspect(executeResult, { depth: 10 }));
    expect(executeResult.success).toBe(false);

    // Verify the context is properly populated
    expect(executeResult.context).toBeDefined();
    expect(executeResult.context?.delegation.delegateeAddress).toBeDefined();
    expect(executeResult.context?.delegation.delegatorPkpInfo.ethAddress).toBe(
      TEST_CONFIG.userPkp!.ethAddress!,
    );

    // Verify policies context shows the transaction was denied
    const policiesContext = executeResult.context?.policiesContext;
    expect(policiesContext).toBeDefined();
    expect(policiesContext!.allow).toBe(false);
    expect(policiesContext!.evaluatedPolicies).toContain(
      '@lit-protocol/vincent-policy-contract-whitelist',
    );

    // Verify the denied policy details
    const deniedPolicy = policiesContext!.deniedPolicy;
    expect(deniedPolicy).toBeDefined();
    expect(deniedPolicy?.packageName).toBe('@lit-protocol/vincent-policy-contract-whitelist');
    expect(deniedPolicy?.result).toBeDefined();
    expect(deniedPolicy?.result?.reason).toBe('Function selector not whitelisted');
    expect(deniedPolicy?.result?.chainId).toBe(8453);
    expect(deniedPolicy?.result?.contractAddress).toBe(BASE_WETH_ADDRESS);
    expect(deniedPolicy?.result?.functionSelector).toBe(
      ethers.utils.id('transferFrom(address,address,uint256)').slice(0, 10),
    );
  });

  it('should fail precheck when transaction has undefined "to" (contract deployment)', async () => {
    const contractDeploymentTransaction = {
      to: undefined, // undefined for contract deployment
      value: '0x00',
      data: '0x608060405234801561001057600080fd5b50', // Sample contract bytecode
      chainId: 8453, // Base Mainnet
      nonce: 0,
      gasPrice: '0x9184e72a000',
      gasLimit: '0x5208',
    };

    const serializedContractDeployment = ethers.utils.serializeTransaction(
      contractDeploymentTransaction,
    );

    const transactionSignerToolClient = getTransactionSignerToolClient();
    const precheckResult = await transactionSignerToolClient.precheck(
      {
        serializedTransaction: serializedContractDeployment,
      },
      {
        delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      },
    );

    expect(precheckResult).toBeDefined();
    console.log(
      'precheckResult for contract deployment',
      util.inspect(precheckResult, { depth: 10 }),
    );
    expect(precheckResult.success).toBe(false);

    if (!precheckResult.success) {
      expect(precheckResult.result.error).toBeDefined();
      expect(precheckResult.result.error).toContain('Transaction must have a "to" address');
      expect(precheckResult.result.error).toContain(
        'Contract deployment transactions are not supported',
      );
    }
  });

  it('should fail execute when transaction has undefined "to" (contract deployment)', async () => {
    const contractDeploymentTransaction = {
      to: undefined, // undefined for contract deployment
      value: '0x00',
      data: '0x608060405234801561001057600080fd5b50', // Sample contract bytecode
      chainId: 8453, // Base Mainnet
      nonce: 0,
      gasPrice: '0x9184e72a000',
      gasLimit: '0x5208',
    };

    const serializedContractDeployment = ethers.utils.serializeTransaction(
      contractDeploymentTransaction,
    );

    const transactionSignerToolClient = getTransactionSignerToolClient();
    const executeResult = await transactionSignerToolClient.execute(
      {
        serializedTransaction: serializedContractDeployment,
      },
      {
        delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      },
    );

    expect(executeResult).toBeDefined();
    console.log(
      'executeResult for contract deployment',
      util.inspect(executeResult, { depth: 10 }),
    );
    expect(executeResult.success).toBe(false);
  });

  it('should successfully run precheck on EIP-1559 Transaction Signer Tool for Base Mainnet', async () => {
    await testPrecheck(RAW_EIP1559_ERC20_TRANSFER_TRANSACTION_ON_BASE);
  });

  it('should execute EIP-1559 Transaction Signer Tool with the Agent Wallet PKP for Base Mainnet', async () => {
    // Store the signed transaction for the next test
    SIGNED_EIP1559_ERC20_TRANSFER_TRANSACTION_ON_BASE = await testExecute(
      RAW_EIP1559_ERC20_TRANSFER_TRANSACTION_ON_BASE,
    );
  });

  it('should send the signed EIP-1559 transaction on Base Mainnet to transfer WETH to the delegatee', async () => {
    await testSend(
      SIGNED_EIP1559_ERC20_TRANSFER_TRANSACTION_ON_BASE,
      BASE_PUBLIC_CLIENT,
      BASE_WETH_ADDRESS,
    );
  });
});
