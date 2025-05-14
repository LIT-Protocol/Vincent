import { parseAbi, getContract } from 'viem';

import { createChronicleYellowstoneViemClient } from './viem-chronicle-yellowstone-client';

export const SPENDING_LIMIT_CONTRACT_ABI = [
  'event Spent(address indexed spender, uint256 indexed appId, uint256 amount, uint256 timestamp)',

  'error EmptyAppIdsArray(address user)',
  'error SpendLimitExceeded(address user, uint256 appId, uint256 amount, uint256 limit)',
  'error ZeroAppIdNotAllowed(address user)',
  'error ZeroDurationQuery(address user)',

  'function checkLimit(address user, uint256 appId, uint256 amountToSpend, uint256 userMaxSpendLimit, uint256 duration) view returns (bool)',
  'function getAppSpendHistory(address user, uint256 appId, uint256 duration) view returns ((uint256 timestamp, uint256 runningSpend)[] history)',
  'function getAppsSpentInDuration(address user, uint256[] appIds, uint256 duration) view returns (uint256)',
  'function getTotalSpent(address user, uint256 duration) view returns (uint256)',
  'function checkLimit(address user, uint256 appId, uint256 amountToSpend, uint256 userMaxSpendLimit, uint256 duration) view returns (bool)',
  'function getAppSpendHistory(address user, uint256 appId, uint256 duration) view returns ((uint256 timestamp, uint256 runningSpend)[] history)',
  'function getAppsSpentInDuration(address user, uint256[] appIds, uint256 duration) view returns (uint256)',
  'function getTotalSpent(address user, uint256 duration) view returns (uint256)',

  'function spend(uint256 appId, uint256 amount, uint256 userMaxSpendLimit, uint256 duration)',
];
const SPENDING_LIMIT_CONTRACT_ADDRESS = '0x756fa449de893446b26e10c6c66e62ccabee908c';

export const getSpendingLimitContractInstance = () => {
  const abi = parseAbi(SPENDING_LIMIT_CONTRACT_ABI);
  const chronicleYellowstoneProvider = createChronicleYellowstoneViemClient();
  const spendingLimitContract = getContract({
    address: SPENDING_LIMIT_CONTRACT_ADDRESS,
    abi,
    client: chronicleYellowstoneProvider,
  });
  return spendingLimitContract;
};
