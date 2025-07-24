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
import { formatEther, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as util from 'node:util';

import {
  BASE_PUBLIC_CLIENT,
  BASE_RPC_URL,
  checkShouldMintAndFundPkp,
  DATIL_PUBLIC_CLIENT,
  ETH_PUBLIC_CLIENT,
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
              functionSelectors: [ethers.utils.id('transfer(address,uint256)').slice(0, 10)],
            },
          },
          // Base Mainnet
          '8453': {
            [BASE_WETH_ADDRESS]: {
              // TODO Decide if we want to support "*" to allow all functions
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

  let TEST_CONFIG: TestConfig;
  let RAW_ERC20_TRANSFER_TRANSACTION: {
    to: string;
    value: string;
    data: string;
    chainId: number;
    nonce: number;
    gasPrice: string;
    gasLimit: string;
  };
  let SERIALIZED_ERC20_TRANSFER_TRANSACTION: string;
  let SIGNED_ERC20_TRANSFER_TRANSACTION: string;

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

    // Get the current nonce for the PKP address
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);

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
    const estimatedGasLimit = await provider.estimateGas(erc20TransferTransactionBase);

    // Add a 5% buffer to the estimated gas
    const gasLimit = estimatedGasLimit.mul(105).div(100);

    // Create the transaction object
    RAW_ERC20_TRANSFER_TRANSACTION = {
      to: erc20TransferTransactionBase.to,
      value: erc20TransferTransactionBase.value,
      data: erc20TransferTransactionBase.data,
      chainId: 8453, // Base Mainnet
      nonce: await provider.getTransactionCount(TEST_CONFIG.userPkp!.ethAddress!),
      gasPrice: (await provider.getGasPrice()).toHexString(),
      gasLimit: gasLimit.toHexString(),
    };

    // Serialize the transaction (unsigned)
    SERIALIZED_ERC20_TRANSFER_TRANSACTION = ethers.utils.serializeTransaction(
      RAW_ERC20_TRANSFER_TRANSACTION,
    );
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
    expect(policyParams?.whitelist?.[1]?.[ETH_WETH_ADDRESS]?.functionSelectors).toContain(
      ethers.utils.id('transfer(address,uint256)').slice(0, 10),
    );

    expect(policyParams?.whitelist?.[8453]?.[BASE_WETH_ADDRESS]?.functionSelectors).toBeDefined();
    expect(policyParams?.whitelist?.[8453]?.[BASE_WETH_ADDRESS]?.functionSelectors).toHaveLength(1);
    expect(policyParams?.whitelist?.[8453]?.[BASE_WETH_ADDRESS]?.functionSelectors).toContain(
      ethers.utils.id('transfer(address,uint256)').slice(0, 10),
    );
  });

  it('should fund TEST_APP_DELEGATEE if they have no Lit test tokens', async () => {
    await fundAppDelegateeIfNeeded();
  });

  it('should successfully run precheck on the Transaction Signer Tool', async () => {
    // Test: Run precheck on Transaction Signer Tool
    const transactionSignerToolClient = getTransactionSignerToolClient();

    // Call the precheck method with the serialized transaction
    const precheckResult = await transactionSignerToolClient.precheck(
      {
        serializedTransaction: SERIALIZED_ERC20_TRANSFER_TRANSACTION,
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

    // The tool precheck should return the deserialized transaction
    expect(precheckResult.result).toBeDefined();
    const deserializedUnsignedTransaction = precheckResult.result?.deserializedUnsignedTransaction;
    expect(deserializedUnsignedTransaction.to).toBe(RAW_ERC20_TRANSFER_TRANSACTION.to);
    expect(deserializedUnsignedTransaction.value).toBe('0x00');
    expect(deserializedUnsignedTransaction.data).toBe(RAW_ERC20_TRANSFER_TRANSACTION.data);
    expect(deserializedUnsignedTransaction.chainId).toBe(RAW_ERC20_TRANSFER_TRANSACTION.chainId);
    expect(deserializedUnsignedTransaction.nonce).toBe(RAW_ERC20_TRANSFER_TRANSACTION.nonce);
    expect(deserializedUnsignedTransaction.gasPrice).toBe(RAW_ERC20_TRANSFER_TRANSACTION.gasPrice);
    expect(deserializedUnsignedTransaction.gasLimit).toBe(RAW_ERC20_TRANSFER_TRANSACTION.gasLimit);

    // The policy precheck should return the permitted chainId, contractAddress, and functionSelector
    const policyPrecheckResult = (precheckResult.context?.policiesContext.allowedPolicies as any)?.[
      '@lit-protocol/vincent-policy-contract-whitelist'
    ]?.result as { chainId: number; contractAddress: string; functionSelector: string };
    expect(policyPrecheckResult).toBeDefined();
    expect(policyPrecheckResult?.chainId).toBe(RAW_ERC20_TRANSFER_TRANSACTION.chainId);
    expect(policyPrecheckResult?.contractAddress).toBe(RAW_ERC20_TRANSFER_TRANSACTION.to);
    expect(policyPrecheckResult?.functionSelector).toBe(
      RAW_ERC20_TRANSFER_TRANSACTION.data.slice(0, 10),
    );
  });

  it('should execute the Transaction Signer Tool with the Agent Wallet PKP', async () => {
    const transactionSignerToolClient = getTransactionSignerToolClient();

    const executeResult = await transactionSignerToolClient.execute(
      {
        serializedTransaction: SERIALIZED_ERC20_TRANSFER_TRANSACTION,
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
    expect(parsedSignedTx.to?.toLowerCase()).toBe(RAW_ERC20_TRANSFER_TRANSACTION.to.toLowerCase());
    expect(parsedSignedTx.nonce).toBe(RAW_ERC20_TRANSFER_TRANSACTION.nonce);
    expect(parsedSignedTx.gasLimit.toHexString()).toBe(RAW_ERC20_TRANSFER_TRANSACTION.gasLimit);
    expect(parsedSignedTx.gasPrice?.toHexString()).toBe(RAW_ERC20_TRANSFER_TRANSACTION.gasPrice);
    expect(parsedSignedTx.data).toBe(RAW_ERC20_TRANSFER_TRANSACTION.data);
    expect(parsedSignedTx.value.toHexString()).toBe(RAW_ERC20_TRANSFER_TRANSACTION.value);
    expect(parsedSignedTx.chainId).toBe(RAW_ERC20_TRANSFER_TRANSACTION.chainId);
    expect(parsedSignedTx.v).toBeDefined();
    expect(parsedSignedTx.r).toBeDefined();
    expect(parsedSignedTx.s).toBeDefined();

    const deserializedSignedTransaction = executeResult.result.deserializedSignedTransaction;
    expect(deserializedSignedTransaction).toBeDefined();

    // Check fields that should match the input transaction
    expect(deserializedSignedTransaction.to).toBe(RAW_ERC20_TRANSFER_TRANSACTION.to);
    expect(deserializedSignedTransaction.value).toBe(RAW_ERC20_TRANSFER_TRANSACTION.value);
    expect(deserializedSignedTransaction.data).toBe(RAW_ERC20_TRANSFER_TRANSACTION.data);
    expect(deserializedSignedTransaction.chainId).toBe(RAW_ERC20_TRANSFER_TRANSACTION.chainId);
    expect(deserializedSignedTransaction.nonce).toBe(RAW_ERC20_TRANSFER_TRANSACTION.nonce);
    expect(deserializedSignedTransaction.gasLimit).toBe(RAW_ERC20_TRANSFER_TRANSACTION.gasLimit);
    expect(deserializedSignedTransaction.gasPrice).toBe(RAW_ERC20_TRANSFER_TRANSACTION.gasPrice);

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
    expect(allowedPolicy.result.chainId).toBe(RAW_ERC20_TRANSFER_TRANSACTION.chainId);
    expect(allowedPolicy.result.contractAddress.toLowerCase()).toBe(
      RAW_ERC20_TRANSFER_TRANSACTION.to.toLowerCase(),
    );
    expect(allowedPolicy.result.functionSelector).toBe(
      RAW_ERC20_TRANSFER_TRANSACTION.data.slice(0, 10),
    );

    // Store the signed transaction for the next test
    SIGNED_ERC20_TRANSFER_TRANSACTION = signedTxHex;
  });

  it('should send the signed transaction Base Mainnet to transfer WETH to the delegatee', async () => {
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
    const initialDelegateeWethBalance = (await BASE_PUBLIC_CLIENT.readContract({
      address: BASE_WETH_ADDRESS,
      abi: wethAbi,
      functionName: 'balanceOf',
      args: [TEST_APP_DELEGATEE_ACCOUNT.address],
    })) as bigint;

    // Send the signed transaction to Base Mainnet
    const txHash = await BASE_PUBLIC_CLIENT.sendRawTransaction({
      serializedTransaction: SIGNED_ERC20_TRANSFER_TRANSACTION as `0x${string}`,
    });

    console.log(`Transaction sent with hash: ${txHash}`);

    // Wait for transaction to be mined
    const receipt = await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: txHash,
    });

    expect(receipt.status).toBe('success');
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    // Wait for the next block to be mined to ensure state changes are reflected
    const currentBlock = await BASE_PUBLIC_CLIENT.getBlockNumber();
    console.log(`Waiting for next block after ${currentBlock}...`);

    await new Promise<void>((resolve) => {
      const unwatch = BASE_PUBLIC_CLIENT.watchBlockNumber({
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
    const finalDelegateeWethBalance = (await BASE_PUBLIC_CLIENT.readContract({
      address: BASE_WETH_ADDRESS,
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
  });
});
