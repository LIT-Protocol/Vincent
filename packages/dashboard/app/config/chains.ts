import { type Chain } from 'viem';

export const yellowstone: Chain = {
  id: 1337,
  name: 'Yellowstone',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
  },
  blockExplorers: {
    default: { name: 'Yellowstone Explorer', url: 'http://localhost:8545' },
  },
  testnet: true,
}; 