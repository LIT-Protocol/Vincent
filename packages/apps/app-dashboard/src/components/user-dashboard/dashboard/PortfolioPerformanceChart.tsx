import { BarChart3 } from 'lucide-react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PortfolioPerformanceChartProps {
  chartData: Array<{ time: string; value: number; fullTime: Date }>;
}

export function PortfolioPerformanceChart({ chartData, showHeader = true }: PortfolioPerformanceChartProps & { showHeader?: boolean }) {
  const containerStyle = showHeader 
    ? {} 
    : { height: '100%', width: '100%' };

  // Debug log
  console.log('PortfolioPerformanceChart - chartData:', chartData);

  return (
    <div className={showHeader ? `${theme.mainCard} border ${theme.cardBorder} rounded-2xl p-6 shadow-lg` : 'h-full w-full'} style={containerStyle}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-xl font-bold ${theme.text} mb-1`}>Portfolio Performance</h3>
            <p className={`text-sm ${theme.textMuted}`}>24-hour value tracking</p>
          </div>
          <div className={`p-3 rounded-xl ${theme.itemBg}`}>
            <BarChart3 className="w-6 h-6 text-orange-500" />
          </div>
        </div>
      )}
      <div style={{ height: showHeader ? '320px' : '100%', width: '100%' }}>
        {!chartData || chartData.length === 0 ? (
          <div className={`text-sm ${theme.textMuted} text-center py-8`}>No chart data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="time" 
                className="fill-gray-600 dark:fill-gray-400"
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis 
                className="fill-gray-600 dark:fill-gray-400"
                fontSize={12}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip 
                labelFormatter={(label) => `Time: ${label}`}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  color: '#1F2937',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                wrapperClassName="dark:!bg-neutral-900 dark:!border-white/10 dark:!text-white"
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#EA580C" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#EA580C', stroke: '#FB923C', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}