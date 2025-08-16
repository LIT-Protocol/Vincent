import { BarChart3 } from 'lucide-react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { Chart } from 'react-google-charts';

// Chain-specific colors mapping
const CHAIN_COLOR_MAPPING: Record<string, string> = {
  'ethereum': '#C0C0C0', // Silver
  'base': '#0052FF', // Base blue
  'polygon': '#8247E5', // Polygon purple
  'optimism': '#FF0420', // Optimism red
  'arbitrum': '#28A0F0', // Arbitrum blue
  'avalanche': '#E84142', // Avalanche red
  'bsc': '#F3BA2F', // Binance Smart Chain gold
  'binance-smart-chain': '#F3BA2F', // Binance Smart Chain gold
  'fantom': '#1969FF', // Fantom blue
  'solana': '#9945FF', // Solana purple
  'linea': '#121212', // Linea black
  'scroll': '#FFEEDA', // Scroll cream
  'zksync-era': '#8C8DFC', // zkSync light purple
  'zora': '#000000', // Zora black
};

const getChainColor = (chainName: string): string => {
  const normalizedName = chainName.toLowerCase().replace(/\s+/g, '-');
  return CHAIN_COLOR_MAPPING[normalizedName] || '#EA580C'; // Default to orange
};

interface ChainDistributionChartProps {
  chainData: Array<[string, string]>;
  chainDistribution: Record<string, number> | null;
}

export function ChainDistributionChart({ chainData, chainDistribution }: ChainDistributionChartProps) {
  const getChainColors = () => {
    if (!chainDistribution) return [];
    
    return Object.keys(chainDistribution)
      .filter((chain) => Number(chainDistribution[chain]) > 0)
      .sort((a, b) => Number(chainDistribution[b]) - Number(chainDistribution[a]))
      .map((chain) => getChainColor(chain));
  };

  return (
    <div className={`${theme.mainCard} border ${theme.cardBorder} rounded-2xl p-6 shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-lg font-bold ${theme.text} mb-1`}>Blockchain Networks</h3>
          <p className={`text-xs ${theme.textMuted}`}>Multi-chain distribution</p>
        </div>
        <div className={`p-2 rounded-lg ${theme.itemBg}`}>
          <BarChart3 className="w-5 h-5 text-orange-500" />
        </div>
      </div>
      <div className="h-64">
        {chainData.length <= 1 ? (
          <div className={`text-sm ${theme.textMuted} text-center py-8`}>No chain data</div>
        ) : (
          <Chart
            chartType="PieChart"
            width="100%"
            height="100%"
            data={chainData}
            options={{
              is3D: true,
              backgroundColor: 'transparent',
              colors: getChainColors(),
              chartArea: { width: '90%', height: '85%' },
              legend: {
                position: 'bottom',
                textStyle: {
                  color: '#6B7280',
                  fontSize: 12
                }
              },
              tooltip: {
                textStyle: {
                  color: '#1F2937',
                  fontSize: 12
                }
              },
              pieSliceTextStyle: {
                color: '#ffffff',
                fontSize: 11
              }
            }}
          />
        )}
      </div>
    </div>
  );
}