import { ethers } from 'ethers';

import { getChainHelpers } from '../chain';
import { MINIMUM_FUNDER_BALANCE } from './index';

export const checkFunderBalance = async () => {
  const {
    wallets: { funder },
  } = await getChainHelpers();

  const funderBalance = await funder.getBalance();
  console.log('Funder Balance:', ethers.utils.formatEther(funderBalance));

  if (funderBalance.lt(MINIMUM_FUNDER_BALANCE)) {
    const errorMessage = `❌ Insufficient funder balance. Current balance is below the required ${ethers.utils.formatEther(MINIMUM_FUNDER_BALANCE)} threshold. Please top up your funder wallet at: https://chronicle-yellowstone-faucet.getlit.dev/`;
    console.log(errorMessage);
    throw new Error(errorMessage);
  }

  return funderBalance;
};
