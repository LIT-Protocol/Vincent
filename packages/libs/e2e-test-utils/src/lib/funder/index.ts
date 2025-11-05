import { ethers } from 'ethers';

export { checkFunderBalance } from './check-funder-balance';
export { ensureWalletHasTestTokens } from './ensure-wallet-has-test-tokens';

export const MINIMUM_FUNDER_BALANCE = ethers.utils.parseEther('0.13');
