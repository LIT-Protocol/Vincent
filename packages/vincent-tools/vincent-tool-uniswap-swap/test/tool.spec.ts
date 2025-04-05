import path from "path";
import { createWalletClient, http, defineChain, createPublicClient, parseEventLogs, encodeAbiParameters, formatEther } from 'viem';
import { privateKeyToAccount } from "viem/accounts";

import { getTestConfig, saveTestConfig, TestConfig, mintNewPkp, executeTool, permitAuthMethod } from "./utils";

import VincentAppFacetAbi from './utils/vincent-contract-abis/VincentAppFacet.abi.json';
import VincentAppViewFacetAbi from './utils/vincent-contract-abis/VincentAppViewFacet.abi.json';
import VincentUserFacetAbi from './utils/vincent-contract-abis/VincentUserFacet.abi.json';
import VincentUserViewFacetAbi from './utils/vincent-contract-abis/VincentUserViewFacet.abi.json';

// Extend Jest timeout to 2 minutes
jest.setTimeout(120000);

const getEnv = (key: string) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
};

describe('Uniswap Swap Tool Tests', () => {
    const VINCENT_ADDRESS = getEnv('VINCENT_ADDRESS');
    const YELLOWSTONE_RPC_URL = getEnv('YELLOWSTONE_RPC_URL');
    const BASE_RPC_URL = getEnv('BASE_RPC_URL');

    const datilChain = defineChain({
        id: 175188,
        name: 'Datil Mainnet',
        network: 'datil',
        nativeCurrency: {
            decimals: 18,
            name: 'Ether',
            symbol: 'ETH',
        },
        rpcUrls: {
            default: {
                http: [YELLOWSTONE_RPC_URL],
            },
            public: {
                http: [YELLOWSTONE_RPC_URL],
            },
        },
    });

    const baseChain = defineChain({
        id: 8453,
        name: 'Base Mainnet',
        network: 'base',
        nativeCurrency: {
            decimals: 18,
            name: 'Ether',
            symbol: 'ETH',
        },
        rpcUrls: {
            default: {
                http: [BASE_RPC_URL],
            },
            public: {
                http: [BASE_RPC_URL],
            },
        },
    });

    const TEST_APP_MANAGER_PRIVATE_KEY = getEnv('TEST_APP_MANAGER_PRIVATE_KEY');
    const TEST_APP_MANAGER_VIEM_ACCOUNT = privateKeyToAccount(TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`);
    const TEST_APP_MANAGER_VIEM_WALLET_CLIENT = createWalletClient({
        account: TEST_APP_MANAGER_VIEM_ACCOUNT,
        chain: datilChain,
        transport: http(YELLOWSTONE_RPC_URL)
    });

    // Create public client for reading transaction receipts and logs
    const DATIL_PUBLIC_CLIENT = createPublicClient({
        chain: datilChain,
        transport: http(YELLOWSTONE_RPC_URL)
    });

    const BASE_PUBLIC_CLIENT = createPublicClient({
        chain: baseChain,
        transport: http(BASE_RPC_URL)
    });

    const TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY = getEnv('TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY');
    const TEST_AGENT_WALLET_PKP_OWNER_VIEM_ACCOUNT = privateKeyToAccount(TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`);
    const TEST_AGENT_WALLET_PKP_OWNER_VIEM_WALLET_CLIENT = createWalletClient({
        account: TEST_AGENT_WALLET_PKP_OWNER_VIEM_ACCOUNT,
        chain: datilChain,
        transport: http(YELLOWSTONE_RPC_URL)
    });

    const TEST_APP_DELEGATEE_PRIVATE_KEY = getEnv('TEST_APP_DELEGATEE_PRIVATE_KEY');
    const TEST_APP_DELEGATEE_ACCOUNT = privateKeyToAccount(TEST_APP_DELEGATEE_PRIVATE_KEY as `0x${string}`)
    const TEST_CONFIG_PATH = path.join(__dirname, './test-config.json');

    const APP_NAME = 'Vincent Test App';
    const APP_DESCRIPTION = 'A test app for the Vincent protocol';
    const AUTHORIZED_REDIRECT_URIS = ['https://testing.vincent.com'];
    const DELEGATEES = [TEST_APP_DELEGATEE_ACCOUNT.address];

    const ERC20_APPROVAL_TOOL_IPFS_ID = getEnv('ERC20_APPROVAL_TOOL_IPFS_ID');
    const UNISWAP_SWAP_TOOL_IPFS_ID = getEnv('UNISWAP_SWAP_TOOL_IPFS_ID');
    const SPENDING_LIMIT_POLICY_IPFS_ID = getEnv('SPENDING_LIMIT_POLICY_IPFS_ID');

    // Enums matching the contract definitions
    enum ParameterType {
        INT256 = 0,
        INT256_ARRAY = 1,
        UINT256 = 2,
        UINT256_ARRAY = 3,
        BOOL = 4,
        BOOL_ARRAY = 5,
        ADDRESS = 6,
        ADDRESS_ARRAY = 7,
        STRING = 8,
        STRING_ARRAY = 9,
        BYTES = 10,
        BYTES_ARRAY = 11
    }

    enum DeploymentStatus {
        DEV = 0,
        TEST = 1,
        PROD = 2
    }

    const TOOL_IPFS_IDS = [ERC20_APPROVAL_TOOL_IPFS_ID, UNISWAP_SWAP_TOOL_IPFS_ID];

    const TOOL_POLICIES = [
        [],
        [SPENDING_LIMIT_POLICY_IPFS_ID]
    ];
    const TOOL_POLICY_PARAMETER_NAMES = [
        [], // No policies for ERC20_APPROVAL_TOOL, so use empty array
        [['maxDailySpendingLimitInUsdCents']] // Parameters for SPENDING_LIMIT_POLICY_TOOL
    ];
    const TOOL_POLICY_PARAMETER_TYPES = [
        [], // No policies for ERC20_APPROVAL_TOOL, so use empty array
        [[ParameterType.UINT256]] // Parameter types for SPENDING_LIMIT_POLICY_TOOL
    ];
    const TOOL_POLICY_PARAMETER_VALUES = [
        [],  // Empty array for the ERC20 Approval Tool (it has no policies)
        [
            [
                // Parameter values for SPENDING_LIMIT_POLICY_TOOL
                encodeAbiParameters(
                    [{ type: 'uint256' }],
                    [BigInt("10000000000000")] // maxDailySpendingLimitInUsdCents $100,000 USD (8 decimals)
                ),
            ]
        ]
    ];

    let TEST_CONFIG: TestConfig;

    beforeAll(async () => {
        TEST_CONFIG = getTestConfig(TEST_CONFIG_PATH);

        // TODO Precheck that Agent Wallet has Lit test tokens

        if (TEST_CONFIG.userPkp!.ethAddress === null) {
            // The Agent Wallet PKP Owner needs to have Lit test tokens
            // in order to mint the Agent Wallet PKP
            const agentWalletOwnerBalance = await DATIL_PUBLIC_CLIENT.getBalance({
                address: TEST_AGENT_WALLET_PKP_OWNER_VIEM_ACCOUNT.address,
            });
            if (agentWalletOwnerBalance === 0n) {
                const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.sendTransaction({
                    to: TEST_AGENT_WALLET_PKP_OWNER_VIEM_ACCOUNT.address,
                    value: BigInt(10000000000000000) // 0.01 ETH in wei
                });
                const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
                    hash: txHash,
                });
                console.log(`ℹ️  Funded TEST_AGENT_WALLET_PKP_OWNER with 0.01 Lit test tokens\nTx hash: ${txHash}`);
                expect(txReceipt.status).toBe('success');
            } else {
                console.log(`ℹ️  TEST_AGENT_WALLET_PKP_OWNER has ${formatEther(agentWalletOwnerBalance)} Lit test tokens`)
            }

            // Mint the Agent Wallet PKP
            const pkpInfo = await mintNewPkp(
                TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`,
                ERC20_APPROVAL_TOOL_IPFS_ID,
                UNISWAP_SWAP_TOOL_IPFS_ID,
                SPENDING_LIMIT_POLICY_IPFS_ID
            );

            console.log(`ℹ️  Minted PKP with token id: ${pkpInfo.tokenId}`);
            console.log(`ℹ️  Minted PKP with address: ${pkpInfo.ethAddress}`);

            expect(pkpInfo.tokenId).toBeDefined();
            expect(pkpInfo.ethAddress).toBeDefined();
            expect(pkpInfo.publicKey).toBeDefined();

            TEST_CONFIG.userPkp = {
                tokenId: pkpInfo.tokenId,
                ethAddress: pkpInfo.ethAddress,
                pkpPubkey: pkpInfo.publicKey
            };

            saveTestConfig(TEST_CONFIG_PATH, TEST_CONFIG);
            console.log(`ℹ️  Saved PKP info to config file: ${TEST_CONFIG_PATH}`);
        } else {
            console.log(`ℹ️  Using existing PKP with token id: ${TEST_CONFIG.userPkp!.tokenId}`);
        }

        // The Agent Wallet PKP needs to have Base ETH and WETH
        // in order to execute the ERC20 Approval and Uniswap Swap Tools
        const agentWalletPkpBaseEthBalance = await BASE_PUBLIC_CLIENT.getBalance({
            address: TEST_CONFIG.userPkp!.ethAddress! as `0x${string}`,
        });
        if (agentWalletPkpBaseEthBalance === 0n) {
            throw new Error(`❌ Agent Wallet PKP has no Base ETH. Please fund ${TEST_CONFIG.userPkp!.ethAddress!} with Base ETH`)
        } else {
            console.log(`ℹ️  Agent Wallet PKP has ${formatEther(agentWalletPkpBaseEthBalance)} Base ETH`)
        }

        const agentWalletPkpBaseWethBalance = await BASE_PUBLIC_CLIENT.getBalance({
            address: TEST_CONFIG.userPkp!.ethAddress! as `0x${string}`,
        });
        if (agentWalletPkpBaseWethBalance === 0n) {
            throw new Error(`❌ Agent Wallet PKP has no Base WETH. Please fund ${TEST_CONFIG.userPkp!.ethAddress!} with Base WETH`)
        } else {
            console.log(`ℹ️  Agent Wallet PKP has ${formatEther(agentWalletPkpBaseWethBalance)} Base WETH`)
        }
    });

    it('should permit the ERC20 Approval Tool, Uniswap Swap Tool, and Spending Limit Policy for the Agent Wallet PKP', async () => {
        await permitAuthMethod(
            TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`,
            TEST_CONFIG.userPkp!.tokenId!,
            ERC20_APPROVAL_TOOL_IPFS_ID,
            UNISWAP_SWAP_TOOL_IPFS_ID,
            SPENDING_LIMIT_POLICY_IPFS_ID
        );
    });

    it('should remove TEST_APP_DELEGATEE_ACCOUNT from an existing App if needed', async () => {
        if (TEST_CONFIG.appId !== null) {
            const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.writeContract({
                address: VINCENT_ADDRESS as `0x${string}`,
                abi: VincentAppFacetAbi,
                functionName: 'removeDelegatee',
                args: [TEST_CONFIG.appId, TEST_APP_DELEGATEE_ACCOUNT.address],
            });

            const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
                hash: txHash,
            });

            expect(txReceipt.status).toBe('success');
            console.log(`Removed Delegatee from App ID: ${TEST_CONFIG.appId}\nTx hash: ${txHash}`);
        } else {
            console.log('🔄 No existing App ID found, checking if Delegatee is registered to an App...');

            let registeredApp: {
                id: bigint;
                name: string;
                description: string;
                isDeleted: boolean;
                deploymentStatus: number;
                manager: `0x${string}`;
                latestVersion: bigint;
                delegatees: `0x${string}`[];
                authorizedRedirectUris: string[];
            } | null = null;

            try {
                registeredApp = await DATIL_PUBLIC_CLIENT.readContract({
                    address: VINCENT_ADDRESS as `0x${string}`,
                    abi: VincentAppViewFacetAbi,
                    functionName: 'getAppByDelegatee',
                    args: [TEST_APP_DELEGATEE_ACCOUNT.address],
                }) as typeof registeredApp;

                if (registeredApp!.manager !== TEST_APP_MANAGER_VIEM_ACCOUNT.address) {
                    throw new Error(`❌ App Delegatee: ${TEST_APP_DELEGATEE_ACCOUNT.address} is already registered to App ID: ${registeredApp!.id.toString()}, and TEST_APP_MANAGER_PRIVATE_KEY is not the owner of the App`);
                }

                console.log(`ℹ️  App Delegatee: ${TEST_APP_DELEGATEE_ACCOUNT.address} is already registered to App ID: ${registeredApp!.id.toString()}. Removing Delegatee...`);

                const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.writeContract({
                    address: VINCENT_ADDRESS as `0x${string}`,
                    abi: VincentAppFacetAbi,
                    functionName: 'removeDelegatee',
                    args: [registeredApp!.id, TEST_APP_DELEGATEE_ACCOUNT.address],
                });

                const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
                    hash: txHash,
                });

                expect(txReceipt.status).toBe('success');
                console.log(`ℹ️  Removed Delegatee from App ID: ${registeredApp!.id}\nTx hash: ${txHash}`);
            } catch (error: unknown) {
                // Check if the error is a DelegateeNotRegistered revert
                if (error instanceof Error && error.message.includes('DelegateeNotRegistered')) {
                    console.log(`ℹ️  App Delegatee: ${TEST_APP_DELEGATEE_ACCOUNT.address} is not registered to any App.`);
                } else {
                    throw new Error(`❌ Error checking if delegatee is registered: ${(error as Error).message}`);
                }
            }
        }
    });

    it('should register a new App', async () => {
        const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.writeContract({
            address: VINCENT_ADDRESS as `0x${string}`,
            abi: VincentAppFacetAbi,
            functionName: 'registerApp',
            args: [
                // AppInfo
                {
                    name: APP_NAME,
                    description: APP_DESCRIPTION,
                    deploymentStatus: DeploymentStatus.DEV,
                    authorizedRedirectUris: AUTHORIZED_REDIRECT_URIS,
                    delegatees: DELEGATEES,
                },
                // VersionTools
                {
                    toolIpfsCids: TOOL_IPFS_IDS,
                    toolPolicies: TOOL_POLICIES,
                    toolPolicyParameterNames: TOOL_POLICY_PARAMETER_NAMES,
                    toolPolicyParameterTypes: TOOL_POLICY_PARAMETER_TYPES,
                }
            ],
        });

        const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
            hash: txHash,
        });
        expect(txReceipt.status).toBe('success');

        const parsedLogs = parseEventLogs({
            abi: VincentAppFacetAbi,
            logs: txReceipt.logs,
        });
        // @ts-expect-error Property 'eventName' does not exist on type Log
        const appRegisteredLog = parsedLogs.filter((log) => log.eventName === 'NewAppRegistered');
        // @ts-expect-error Property 'args' does not exist on type Log
        const newAppId = appRegisteredLog[0].args.appId;

        expect(newAppId).toBeDefined();
        if (TEST_CONFIG.appId !== null) expect(newAppId).toBeGreaterThan(BigInt(TEST_CONFIG.appId));

        TEST_CONFIG.appId = newAppId;
        TEST_CONFIG.appVersion = "1";
        saveTestConfig(TEST_CONFIG_PATH, TEST_CONFIG);
        console.log(`Registered new App with ID: ${TEST_CONFIG.appId}\nTx hash: ${txHash}`);
    });

    it('should permit the App version for the Agent Wallet PKP', async () => {
        const txHash = await TEST_AGENT_WALLET_PKP_OWNER_VIEM_WALLET_CLIENT.writeContract({
            address: VINCENT_ADDRESS as `0x${string}`,
            abi: VincentUserFacetAbi,
            functionName: 'permitAppVersion',
            args: [
                BigInt(TEST_CONFIG.userPkp!.tokenId!),
                BigInt(TEST_CONFIG.appId!),
                BigInt(TEST_CONFIG.appVersion!),
                TOOL_IPFS_IDS,
                TOOL_POLICIES,
                TOOL_POLICY_PARAMETER_NAMES,
                TOOL_POLICY_PARAMETER_VALUES
            ],
        });

        const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
            hash: txHash,
        });
        expect(txReceipt.status).toBe('success');
        console.log(`Permitted App with ID ${TEST_CONFIG.appId} and version ${TEST_CONFIG.appVersion} for Agent Wallet PKP with token id ${TEST_CONFIG.userPkp!.tokenId}\nTx hash: ${txHash}`);
    })

    it('should validate the Delegatee has permission to execute the ERC20 Approval Tool with the Agent Wallet PKP', async () => {
        const validationResult = await DATIL_PUBLIC_CLIENT.readContract({
            address: VINCENT_ADDRESS as `0x${string}`,
            abi: VincentUserViewFacetAbi,
            functionName: 'validateToolExecutionAndGetPolicies',
            args: [
                TEST_APP_DELEGATEE_ACCOUNT.address,
                BigInt(TEST_CONFIG.userPkp!.tokenId!),
                TOOL_IPFS_IDS[0],
            ],
        }) as {
            isPermitted: boolean;
            appId: bigint;
            appVersion: bigint;
            policies: string[][];
        };

        expect(validationResult).toBeDefined();
        expect(validationResult.isPermitted).toBe(true);
        expect(validationResult.appId).toBe(BigInt(TEST_CONFIG.appId!));
        expect(validationResult.appVersion).toBe(BigInt(TEST_CONFIG.appVersion!));
        expect(validationResult.policies).toEqual([]);
    })

    it('should validate the Delegatee has permission to execute the Uniswap Swap Tool with the Agent Wallet PKP', async () => {
        const validationResult = await DATIL_PUBLIC_CLIENT.readContract({
            address: VINCENT_ADDRESS as `0x${string}`,
            abi: VincentUserViewFacetAbi,
            functionName: 'validateToolExecutionAndGetPolicies',
            args: [
                TEST_APP_DELEGATEE_ACCOUNT.address,
                BigInt(TEST_CONFIG.userPkp!.tokenId!),
                TOOL_IPFS_IDS[1],
            ],
        }) as {
            isPermitted: boolean;
            appId: bigint;
            appVersion: bigint;
            policies: string[][];
        };

        expect(validationResult).toBeDefined();
        expect(validationResult.isPermitted).toBe(true);
        expect(validationResult.appId).toBe(BigInt(TEST_CONFIG.appId!));
        expect(validationResult.appVersion).toBe(BigInt(TEST_CONFIG.appVersion!));
        expect(validationResult.policies).toEqual([
            {
                policyIpfsCid: SPENDING_LIMIT_POLICY_IPFS_ID,
                parameters: [
                    {
                        name: "maxDailySpendingLimitInUsdCents",
                        paramType: 2,
                        value: encodeAbiParameters(
                            [{ type: 'uint256' }],
                            [BigInt("10000000000000")] // maxDailySpendingLimitInUsdCents $100,000 USD (8 decimals)
                        ),
                    },
                ],
            },
        ]);
    })

    it('should fund TEST_APP_DELEGATEE if they have no Lit test tokens', async () => {
        const balance = await DATIL_PUBLIC_CLIENT.getBalance({
            address: TEST_APP_DELEGATEE_ACCOUNT.address,
        });
        if (balance === 0n) {
            const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.sendTransaction({
                to: TEST_APP_DELEGATEE_ACCOUNT.address,
                value: BigInt(10000000000000000) // 0.01 ETH in wei
            });
            const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
                hash: txHash,
            });
            console.log(`Funded TEST_APP_DELEGATEE with 0.01 ETH\nTx hash: ${txHash}`);
            expect(txReceipt.status).toBe('success');
        } else {
            expect(balance).toBeGreaterThan(0n);
        }
    });

    it('should execute the ERC20 Approval Tool with the Agent Wallet PKP', async () => {
        const erc20ApprovalExecutionResult = await executeTool({
            toolIpfsCid: ERC20_APPROVAL_TOOL_IPFS_ID,
            toolParameters: {
                pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
                rpcUrl: BASE_RPC_URL,
                chainId: '8453',
                tokenIn: '0x4200000000000000000000000000000000000006', // WETH
                amountIn: '0.00001',
            },
            delegateePrivateKey: TEST_APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
            debug: true,
        });

        expect(erc20ApprovalExecutionResult).toBeDefined();

        const parsedResponse = JSON.parse(erc20ApprovalExecutionResult.response as string);

        expect(parsedResponse.status).toBe("success");
        expect(parsedResponse.approvalTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    })

    it('should execute the Uniswap Swap Tool with the Agent Wallet PKP', async () => {
        const uniswapSwapExecutionResult = await executeTool({
            toolIpfsCid: UNISWAP_SWAP_TOOL_IPFS_ID,
            toolParameters: {
                pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
                rpcUrl: BASE_RPC_URL,
                chainId: '8453',
                tokenIn: '0x4200000000000000000000000000000000000006', // WETH
                tokenOut: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', // DEGEN
                amountIn: '0.00001',
            },
            delegateePrivateKey: TEST_APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
            debug: true,
        });

        expect(uniswapSwapExecutionResult).toBeDefined();

        const parsedResponse = JSON.parse(uniswapSwapExecutionResult.response as string);

        expect(parsedResponse.status).toBe("success");
        expect(parsedResponse.swapTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

        const swapTxReceipt = await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
            hash: parsedResponse.swapTxHash,
        });
        expect(swapTxReceipt.status).toBe('success');
    })
});