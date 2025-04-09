import { formatEther } from "viem";

import { TestConfig, saveTestConfig, mintNewPkp } from ".";
import { TEST_APP_MANAGER_VIEM_WALLET_CLIENT, TEST_AGENT_WALLET_PKP_OWNER_VIEM_ACCOUNT, DATIL_PUBLIC_CLIENT, TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY, ERC20_APPROVAL_TOOL_IPFS_ID, UNISWAP_SWAP_TOOL_IPFS_ID, SPENDING_LIMIT_POLICY_IPFS_ID, TEST_CONFIG_PATH } from "./test-variables";

export const checkShouldMintAndFundPkp = async (testConfig: TestConfig) => {
    if (testConfig.userPkp!.ethAddress === null) {
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

        testConfig.userPkp = {
            tokenId: pkpInfo.tokenId,
            ethAddress: pkpInfo.ethAddress,
            pkpPubkey: pkpInfo.publicKey
        };

        saveTestConfig(TEST_CONFIG_PATH, testConfig);
        console.log(`ℹ️  Saved PKP info to config file: ${TEST_CONFIG_PATH}`);
    } else {
        console.log(`ℹ️  Using existing PKP with token id: ${testConfig.userPkp!.tokenId}`);

        const agentWalletPkpBalance = await DATIL_PUBLIC_CLIENT.getBalance({
            address: testConfig.userPkp!.ethAddress! as `0x${string}`,
        });
        if (agentWalletPkpBalance === 0n) {
            const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.sendTransaction({
                to: testConfig.userPkp!.ethAddress! as `0x${string}`,
                value: BigInt(10000000000000000) // 0.01 ETH in wei
            });
            const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
                hash: txHash,
            });
            console.log(`ℹ️  Funded Agent Wallet PKP with 0.01 Lit test tokens\nTx hash: ${txHash}`);
            expect(txReceipt.status).toBe('success');
        } else {
            console.log(`ℹ️  Agent Wallet PKP has ${formatEther(agentWalletPkpBalance)} Lit test tokens`)
        }
    }

    return testConfig;
}