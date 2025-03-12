/**
 * Truncates an Ethereum address to show first 6 and last 4 characters
 * @param address The Ethereum address to truncate
 * @returns The truncated address string
 */
export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}