import { ethers } from 'ethers';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { LIT_NETWORK } from '@lit-protocol/constants';

import { isCapacityCreditExpired } from './is-capacity-credit-expired';
import { mintCapacityCredit } from './mint-capacity-credit';
import { saveTestConfig, TestConfig } from './test-config';
import {
  TEST_APP_DELEGATEE_PRIVATE_KEY,
  TEST_CONFIG_PATH,
  YELLOWSTONE_RPC_URL,
} from './test-variables';

export const checkShouldMintCapacityCredit = async (testConfig: TestConfig) => {
  if (
    testConfig.capacityCreditInfo === undefined ||
    testConfig.capacityCreditInfo.mintedAtUtc === null ||
    testConfig.capacityCreditInfo.daysUntilUTCMidnightExpiration === null ||
    isCapacityCreditExpired(
      testConfig.capacityCreditInfo.mintedAtUtc,
      testConfig.capacityCreditInfo.daysUntilUTCMidnightExpiration,
    )
  ) {
    console.log('Minting new capacity credit');
    const delegateeWallet = new ethers.Wallet(
      TEST_APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
      new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
    );
    const litContractClient = new LitContracts({
      signer: delegateeWallet,
      network: LIT_NETWORK.Datil,
    });
    await litContractClient.connect();

    testConfig.capacityCreditInfo = await mintCapacityCredit(litContractClient, {
      requestsPerKilosecond: 80,
      daysUntilUTCMidnightExpiration: 25,
    });
    console.log(
      `Minted new capacity credit with token id: ${testConfig.capacityCreditInfo!.capacityTokenId}`,
    );

    saveTestConfig(TEST_CONFIG_PATH, testConfig);
  } else {
    console.log(
      `Capacity credit is not expired, using existing capacity credit with token id: ${testConfig.capacityCreditInfo!.capacityTokenId}`,
    );
  }

  return testConfig;
};
