import { getEnv, handleVincentAppDelegatees } from '@lit-protocol/vincent-tool-sdk';
import { ethers } from 'ethers';

import { vincentToolsForVincentApp } from './vincent-tool-and-policies';

(async () => {
  const TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY = getEnv('TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY');
  if (TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY === undefined) {
    console.error('❌ TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY environment variable is not set');
    process.exit(1);
  }
  const testVincentAppDelegateeWallet = new ethers.Wallet(TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY);

  await handleVincentAppDelegatees({
    vincentAppDelegatees: [testVincentAppDelegateeWallet.address],
    vincentAppToolIpfsCids: vincentToolsForVincentApp.map((tool) => tool.ipfsCid),
  });
})();
