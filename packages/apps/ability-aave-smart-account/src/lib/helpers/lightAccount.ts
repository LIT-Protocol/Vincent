import { ethers } from 'ethers';

export const LIGHT_ACCOUNT_INIT_CODE = '0X';

export const lightIface = new ethers.utils.Interface([
  'function execute(address to, uint256 value, bytes data) external',
  'function executeBatch(address[] to, bytes[] data) external',
]);
