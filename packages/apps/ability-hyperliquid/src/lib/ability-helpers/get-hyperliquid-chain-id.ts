export const getHyperliquidChainId = (useTestnet: boolean): string => {
  // Select chain ID and network based on testnet flag
  return useTestnet
    ? '0x66eee' // Arbitrum Sepolia testnet chain ID: 421614
    : '0xa4b1'; // Arbitrum mainnet chain ID: 42161
};

export const getHyperliquidChainName = (useTestnet: boolean): string => {
  return useTestnet ? 'Testnet' : 'Mainnet';
};
