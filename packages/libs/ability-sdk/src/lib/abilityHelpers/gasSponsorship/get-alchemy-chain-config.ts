import {
  arbitrum,
  arbitrumGoerli,
  arbitrumNova,
  arbitrumSepolia,
  base,
  baseGoerli,
  baseSepolia,
  fraxtal,
  fraxtalSepolia,
  goerli,
  mainnet,
  optimism,
  optimismGoerli,
  optimismSepolia,
  polygon,
  polygonAmoy,
  polygonMumbai,
  sepolia,
  shape,
  shapeSepolia,
  worldChain,
  worldChainSepolia,
  zora,
  zoraSepolia,
  beraChainBartio,
  opbnbMainnet,
  opbnbTestnet,
  soneiumMinato,
  soneiumMainnet,
  unichainMainnet,
  unichainSepolia,
  inkMainnet,
  inkSepolia,
  mekong,
  monadTestnet,
  openlootSepolia,
  gensynTestnet,
  riseTestnet,
  storyMainnet,
  storyAeneid,
  celoAlfajores,
  celoMainnet,
  teaSepolia,
  bobaSepolia,
  bobaMainnet,
} from '@account-kit/infra';

/**
 * Helper function to get Alchemy chain configuration
 * Automatically supports all chains exported from @account-kit/infra by matching chainId to chain.id
 *
 * @returns The Alchemy chain configuration as a Viem Chain object. Using typeof mainnet to avoid adding Viem as a dev dependency just for the Chain type.
 */
export function getAlchemyChainConfig(chainId: number): typeof mainnet {
  // Array of all supported chain objects
  const supportedChains = [
    arbitrum,
    arbitrumGoerli,
    arbitrumNova,
    arbitrumSepolia,
    base,
    baseGoerli,
    baseSepolia,
    fraxtal,
    fraxtalSepolia,
    goerli,
    mainnet,
    optimism,
    optimismGoerli,
    optimismSepolia,
    polygon,
    polygonAmoy,
    polygonMumbai,
    sepolia,
    shape,
    shapeSepolia,
    worldChain,
    worldChainSepolia,
    zora,
    zoraSepolia,
    beraChainBartio,
    opbnbMainnet,
    opbnbTestnet,
    soneiumMinato,
    soneiumMainnet,
    unichainMainnet,
    unichainSepolia,
    inkMainnet,
    inkSepolia,
    mekong,
    monadTestnet,
    openlootSepolia,
    gensynTestnet,
    riseTestnet,
    storyMainnet,
    storyAeneid,
    celoAlfajores,
    celoMainnet,
    teaSepolia,
    bobaSepolia,
    bobaMainnet,
  ];

  // Find the chain that matches the requested chainId
  const chain = supportedChains.find((c) => c.id === chainId);

  if (!chain) {
    throw new Error(
      `Chain ID ${chainId} not supported by @account-kit/infra. ` +
        `Supported chain IDs: ${supportedChains.map((c) => c.id).join(', ')}`,
    );
  }

  return chain;
}
