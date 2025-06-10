import { http, createPublicClient } from 'viem';
import type { Chain } from 'viem';

export function createChronicleYellowstoneViemClient() {
  const yellowstoneChain: Chain = {
    id: 175188,
    name: 'Chronicle Yellowstone - Lit Protocol Testnet',
    nativeCurrency: {
      name: 'Test LPX',
      symbol: 'tstLPX',
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ['https://yellowstone-rpc.litprotocol.com/'],
      },
      public: {
        http: ['https://yellowstone-rpc.litprotocol.com/'],
      },
    },
    blockExplorers: {
      default: {
        name: 'Yellowstone Explorer',
        url: 'https://yellowstone-explorer.litprotocol.com/',
      },
    },
  };

  return createPublicClient({
    chain: yellowstoneChain,
    transport: http(),
  });
}
