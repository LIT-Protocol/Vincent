import { ethers } from 'ethers';

export const lightIface = new ethers.utils.Interface([
  'function execute(address to, uint256 value, bytes data) external',
  'function executeBatch(address[] to, bytes[] data) external',
]);
