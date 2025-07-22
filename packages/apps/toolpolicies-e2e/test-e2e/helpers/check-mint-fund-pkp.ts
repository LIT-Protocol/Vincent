import { formatEther } from 'viem';

import {
  DATIL_PUBLIC_CLIENT,
  mintNewPkp,
  saveTestConfig,
  TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
  TEST_CONFIG_PATH,
  TEST_FUNDER_VIEM_WALLET_CLIENT,
  TestConfig,
} from '.';
import { privateKeyToAccount } from 'viem/accounts';

export const checkShouldMintAndFundPkp = async (testConfig: TestConfig) => {
  if (testConfig.userPkp!.ethAddress === null) {
    // The Agent Wallet PKP Owner needs to have Lit test tokens
    // in order to mint the Agent Wallet PKP
    const agentWalletOwnerBalance = await DATIL_PUBLIC_CLIENT.getBalance({
      address: privateKeyToAccount(TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`)
        .address,
    });
    if (agentWalletOwnerBalance === 0n) {
      const txHash = await TEST_FUNDER_VIEM_WALLET_CLIENT.sendTransaction({
        to: privateKeyToAccount(TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`).address,
        value: BigInt(10000000000000000), // 0.01 ETH in wei
      });
      const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: txHash,
      });
      console.log(
        `ℹ️  Funded TEST_AGENT_WALLET_PKP_OWNER with 0.01 Lit test tokens\nTx hash: ${txHash}`,
      );
      expect(txReceipt.status).toBe('success');
    } else {
      console.log(
        `ℹ️  TEST_AGENT_WALLET_PKP_OWNER has ${formatEther(agentWalletOwnerBalance)} Lit test tokens`,
      );
    }

    // Mint the Agent Wallet PKP
    const pkpInfo = await mintNewPkp(TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`);

    console.log(`ℹ️  Minted PKP with token id: ${pkpInfo.tokenId}`);
    console.log(`ℹ️  Minted PKP with address: ${pkpInfo.ethAddress}`);

    expect(pkpInfo.tokenId).toBeDefined();
    expect(pkpInfo.ethAddress).toBeDefined();
    expect(pkpInfo.publicKey).toBeDefined();

    testConfig.userPkp = {
      tokenId: pkpInfo.tokenId,
      ethAddress: pkpInfo.ethAddress,
      pkpPubkey: pkpInfo.publicKey,
    };

    saveTestConfig(TEST_CONFIG_PATH, testConfig);
    console.log(`ℹ️  Saved PKP info to config file: ${TEST_CONFIG_PATH}`);
  } else {
    console.log(`ℹ️  Using existing PKP with token id: ${testConfig.userPkp!.tokenId}`);

    const agentWalletPkpBalance = await DATIL_PUBLIC_CLIENT.getBalance({
      address: testConfig.userPkp!.ethAddress! as `0x${string}`,
    });
    if (agentWalletPkpBalance === 0n) {
      const txHash = await TEST_FUNDER_VIEM_WALLET_CLIENT.sendTransaction({
        to: testConfig.userPkp!.ethAddress! as `0x${string}`,
        value: BigInt(10000000000000000), // 0.01 ETH in wei
      });
      const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: txHash,
      });
      console.log(`ℹ️  Funded Agent Wallet PKP with 0.01 Lit test tokens\nTx hash: ${txHash}`);
      expect(txReceipt.status).toBe('success');
    } else {
      console.log(`ℹ️  Agent Wallet PKP has ${formatEther(agentWalletPkpBalance)} Lit test tokens`);
    }
  }

  return testConfig;
};
