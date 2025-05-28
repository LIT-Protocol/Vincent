import { Chain, http } from 'viem';
import { createConfig } from 'wagmi';

export const anvilFirstPrivateKey =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

export class Anvil {
  public static rpcUrls: string[] = ['http://127.0.0.1:8545'];
  public static explorerUrl = 'http://127.0.0.1:8545';

  /**
   * Returns the chain configuration for Anvil
   * @returns Chain configuration object
   */
  public static chainConfig(): Chain {
    return {
      id: 31337,
      name: 'Local Anvil',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: Anvil.rpcUrls,
          webSocket: [],
        },
        public: {
          http: Anvil.rpcUrls,
          webSocket: [],
        },
      },
      blockExplorers: {
        default: {
          name: 'Anvil Explorer',
          url: Anvil.explorerUrl,
        },
      },
    };
  }

  /**
   * Creates a Wagmi configuration for the Anvil chain
   * @returns Wagmi configuration object for Anvil
   */
  public static wagmiConfig() {
    return createConfig({
      chains: [Anvil.chainConfig()],
      transports: {
        [Anvil.chainConfig().id]: http(),
      },
    });
  }
}

// Export the RPC URL for backward compatibility
export const anvilRpcUrl = Anvil.rpcUrls[0];

// Export the config object for backward compatibility
export const anvilConfig = Anvil.chainConfig();
