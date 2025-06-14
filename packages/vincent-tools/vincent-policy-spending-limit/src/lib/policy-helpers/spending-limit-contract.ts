import { ethers } from 'ethers';

const SPENDING_LIMIT_CONTRACT_ABI = [
  'event Spent(address indexed spender, uint256 indexed appId, uint256 amount, uint256 timestamp)',

  'error EmptyAppIdsArray(address user)',
  'error SpendLimitExceeded(address user, uint256 appId, uint256 amount, uint256 limit)',
  'error ZeroAppIdNotAllowed(address user)',
  'error ZeroDurationQuery(address user)',

  'function checkLimit(address user, uint256 appId, uint256 amountToSpend, uint256 userMaxSpendLimit, uint256 duration) view returns (bool)',
  'function getAppSpendHistory(address user, uint256 appId, uint256 duration) view returns ((uint256 timestamp, uint256 runningSpend)[] history)',
  'function getAppsSpentInDuration(address user, uint256[] appIds, uint256 duration) view returns (uint256)',
  'function getTotalSpent(address user, uint256 duration) view returns (uint256)',

  'function spend(uint256 appId, uint256 amount, uint256 userMaxSpendLimit, uint256 duration)',
] as const;

export const SPENDING_LIMIT_CONTRACT_ADDRESS = '0x756fa449de893446b26e10c6c66e62ccabee908c';

export const getSpendingLimitContractInstance = () => {
  return new ethers.Contract(
    SPENDING_LIMIT_CONTRACT_ADDRESS,
    SPENDING_LIMIT_CONTRACT_ABI,
    new ethers.providers.StaticJsonRpcProvider('https://yellowstone-rpc.litprotocol.com/'),
  );
};
