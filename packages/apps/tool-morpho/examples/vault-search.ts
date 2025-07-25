import {
  getVaults,
  CHAIN_IDS,
  type MorphoVaultInfo,
  type VaultFilterOptions,
} from '../src/lib/helpers/index.js';

async function demonstrateUnifiedVaultSearch(): Promise<void> {
  console.log('🔧 Unified Vault Search Examples\n');

  try {
    // Example 1: Get vaults by chain
    console.log('📍 Example 1: Vaults on Base Chain');
    const baseVaults: MorphoVaultInfo[] = await getVaults({
      chainId: CHAIN_IDS.base,
      limit: 100,
      excludeIdle: true,
      sortBy: 'totalAssetsUsd',
      sortOrder: 'desc',
      minNetApy: 0.05, // 5% minimum APY
    });

    console.log(`Found ${baseVaults.length} vaults on Base:`);
    baseVaults.forEach((vault: MorphoVaultInfo, index: number) => {
      console.log(`  ${index + 1}. ${vault.name} (${vault.asset.symbol})`);
      console.log(
        `     TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}, APY: ${(
          100 * (vault.metrics.netApy || 0)
        ).toFixed(4)}%`,
      );
    });
    console.log('');

    // Example 2: Get vaults by asset
    console.log('💰 Example 2: WETH Vaults Across All Chains');
    // Using symbol search (more flexible than address)
    const wethVaults: MorphoVaultInfo[] = await getVaults({
      assetSymbol: 'WETH', // More flexible than address
      limit: 100,
      excludeIdle: true,
      sortBy: 'netApy',
      sortOrder: 'desc',
    });

    console.log(`Found ${wethVaults.length} WETH vaults:`);
    wethVaults.forEach((vault: MorphoVaultInfo, index: number) => {
      console.log(`  ${index + 1}. ${vault.name} on ${vault.chain.network}`);
      console.log(
        `     APY: ${(100 * (vault.metrics.netApy || 0)).toFixed(
          4,
        )}%, TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`,
      );
    });
    console.log('');

    // Example 3: Combined asset + chain filtering
    console.log('🎯 Example 3: USDC Vaults on Base');
    const usdcBaseVaults: MorphoVaultInfo[] = await getVaults({
      assetSymbol: 'USDC',
      chainId: CHAIN_IDS.base,
      limit: 100,
      excludeIdle: true,
      sortBy: 'netApy',
      sortOrder: 'desc',
    });

    console.log(`Found ${usdcBaseVaults.length} USDC vaults on Base:`);
    usdcBaseVaults.forEach((vault: MorphoVaultInfo, index: number) => {
      console.log(`  ${index + 1}. ${vault.name}`);
      console.log(
        `     APY: ${(100 * (vault.metrics.netApy || 0)).toFixed(
          4,
        )}%, TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}, address: ${vault.address}`,
      );
    });
    console.log('');

    // Example 4: Advanced filtering - High APY vaults with minimum TVL
    console.log('🏆 Example 4: High-Yield Vaults (>5% APY, >$1M TVL)');
    const filterOptions: VaultFilterOptions = {
      minNetApy: 0.05,
      minTvl: 1000000, // $1M minimum TVL
      excludeIdle: true,
      sortBy: 'netApy',
      sortOrder: 'desc',
      limit: 5,
    };
    const highYieldVaults: MorphoVaultInfo[] = await getVaults(filterOptions);

    console.log(`Found ${highYieldVaults.length} high-yield vaults:`);
    highYieldVaults.forEach((vault: MorphoVaultInfo, index: number) => {
      console.log(
        `  ${index + 1}. ${vault.name} (${vault.asset.symbol}) on ${vault.chain.network}`,
      );
      console.log(
        `     APY: ${(100 * (vault.metrics.netApy || 0)).toFixed(
          4,
        )}%, TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`,
      );
    });
    console.log('');

    // Example 5: Multiple asset types on specific chain
    console.log('🔗 Example 5: USDC and WETH Vaults on Base');
    const [usdcBase, wethBase]: [MorphoVaultInfo[], MorphoVaultInfo[]] = await Promise.all([
      getVaults({
        assetSymbol: 'USDC',
        chainId: CHAIN_IDS.base,
        limit: 2,
        excludeIdle: true,
        sortBy: 'netApy',
        sortOrder: 'desc',
      }),
      getVaults({
        assetSymbol: 'WETH',
        chainId: CHAIN_IDS.base,
        limit: 2,
        excludeIdle: true,
        sortBy: 'netApy',
        sortOrder: 'desc',
      }),
    ]);

    console.log('Best USDC vaults on Base:');
    usdcBase.forEach((vault: MorphoVaultInfo, index: number) => {
      console.log(
        `  ${index + 1}. ${vault.name} - ${(100 * (vault.metrics.netApy || 0)).toFixed(4)}% APY`,
      );
    });

    console.log('Best WETH vaults on Base:');
    wethBase.forEach((vault: MorphoVaultInfo, index: number) => {
      console.log(
        `  ${index + 1}. ${vault.name} - ${(100 * (vault.metrics.netApy || 0)).toFixed(4)}% APY`,
      );
    });
    console.log('');

    // Example 6: Whitelisted vaults only
    console.log('✅ Example 6: Whitelisted Vaults Only');
    const whitelistedVaults: MorphoVaultInfo[] = await getVaults({
      whitelistedOnly: true,
      excludeIdle: true,
      sortBy: 'totalAssetsUsd',
      sortOrder: 'desc',
      limit: 5,
    });

    console.log(`Found ${whitelistedVaults.length} whitelisted vaults:`);
    whitelistedVaults.forEach((vault: MorphoVaultInfo, index: number) => {
      console.log(
        `  ${index + 1}. ${vault.name} (${vault.asset.symbol}) on ${vault.chain.network}`,
      );
      console.log(
        `     TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}, APY: ${(
          100 * (vault.metrics.netApy || 0)
        ).toFixed(4)}%`,
      );
    });
    console.log('');

    // Example 7: TVL range filtering
    console.log('📊 Example 7: Medium-sized Vaults ($100K - $10M TVL)');
    const mediumVaults: MorphoVaultInfo[] = await getVaults({
      minTvl: 100000, // $100K minimum
      maxTvl: 10000000, // $10M maximum
      excludeIdle: true,
      sortBy: 'netApy',
      sortOrder: 'desc',
      limit: 5,
    });

    console.log(`Found ${mediumVaults.length} medium-sized vaults:`);
    mediumVaults.forEach((vault: MorphoVaultInfo, index: number) => {
      console.log(
        `  ${index + 1}. ${vault.name} (${vault.asset.symbol}) on ${vault.chain.network}`,
      );
      console.log(
        `     TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}, APY: ${(
          100 * (vault.metrics.netApy || 0)
        ).toFixed(4)}%`,
      );
    });
    console.log('');

    // Example 8: Multi-chain comparison for same asset
    console.log('⚡ Example 8: USDC Vault APY Comparison Across Chains');
    const chainsToCompare: number[] = [CHAIN_IDS.ethereum, CHAIN_IDS.base, CHAIN_IDS.polygon];

    for (const chainId of chainsToCompare) {
      const chainName: string | undefined = Object.keys(CHAIN_IDS).find(
        (key: string) => CHAIN_IDS[key as keyof typeof CHAIN_IDS] === chainId,
      );
      const bestUsdcVault: MorphoVaultInfo[] = await getVaults({
        assetSymbol: 'USDC',
        chainId,
        limit: 1,
        excludeIdle: true,
        sortBy: 'netApy',
        sortOrder: 'desc',
      });

      if (bestUsdcVault.length > 0) {
        const vault: MorphoVaultInfo = bestUsdcVault[0];
        console.log(
          `  ${chainName}: ${(100 * (vault.metrics.netApy || 0)).toFixed(4)}% APY (${vault.name})`,
        );
      } else {
        console.log(`  ${chainName}: No USDC vaults found`);
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error during unified vault search:', errorMessage);
    console.error('   Make sure you have internet connectivity to access the Morpho API');
  }
}

// Run the demonstration
demonstrateUnifiedVaultSearch().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('❌ Failed to run vault search demonstration:', errorMessage);
  process.exit(1);
});
