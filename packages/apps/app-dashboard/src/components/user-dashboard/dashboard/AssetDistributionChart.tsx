import { PieChart } from 'lucide-react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { Chart } from 'react-google-charts';

const PORTFOLIO_COLORS = [
  '#EA580C', // Orange primary
  '#FB923C', // Orange light
  '#C2410C', // Orange dark
  '#1F2937', // Dark gray/black
  '#6B7280', // Medium gray
];

interface AssetDistributionChartProps {
  portfolioData: Array<[string, string]>;
}

export function AssetDistributionChart({ portfolioData }: AssetDistributionChartProps) {
  return (
    <div className={`${theme.mainCard} border ${theme.cardBorder} rounded-2xl p-6 shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-lg font-bold ${theme.text} mb-1`}>Asset Types</h3>
          <p className={`text-xs ${theme.textMuted}`}>Portfolio distribution</p>
        </div>
        <div className={`p-2 rounded-lg ${theme.itemBg}`}>
          <PieChart className="w-5 h-5 text-orange-500" />
        </div>
      </div>
      <div className="h-64">
        {portfolioData.length <= 1 ? (
          <div className={`text-sm ${theme.textMuted} text-center py-8`}>No portfolio data</div>
        ) : (
          <Chart
            chartType="PieChart"
            width="100%"
            height="100%"
            data={portfolioData}
            options={{
              is3D: true,
              backgroundColor: 'transparent',
              colors: PORTFOLIO_COLORS,
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