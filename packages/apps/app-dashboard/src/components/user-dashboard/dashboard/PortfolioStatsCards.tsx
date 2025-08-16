import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';

interface PortfolioStatsCardsProps {
  portfolioValue: string | null;
  change24h: { percentage: number; absolute: number } | null;
  chartData: Array<{ time: string; value: number; fullTime: Date }>;
}

export function PortfolioStatsCards({ portfolioValue, change24h, chartData }: PortfolioStatsCardsProps) {
  const get24hHigh = () => {
    const currentValue = portfolioValue ? parseFloat(portfolioValue.replace(/[$,]/g, '')) : 0;
    if (chartData.length === 0) return `$${currentValue.toFixed(2)}`;
    const maxValue = Math.max(...chartData.map(d => d.value), currentValue);
    return `$${maxValue.toFixed(2)}`;
  };

  const get24hLow = () => {
    const currentValue = portfolioValue ? parseFloat(portfolioValue.replace(/[$,]/g, '')) : 0;
    if (chartData.length === 0) return `$${currentValue.toFixed(2)}`;
    
    // Filter out zero values from chart data for realistic minimum
    const validValues = chartData.map(d => d.value).filter(v => v > 0);
    const minValue = validValues.length > 0 
      ? Math.min(...validValues, currentValue) 
      : currentValue;
    
    return `$${minValue.toFixed(2)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Value Card */}
      <div className={`${theme.mainCard} border ${theme.cardBorder} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${theme.itemBg} group-hover:bg-orange-50 dark:group-hover:bg-orange-900/20 transition-colors`}>
            <DollarSign className="w-6 h-6 text-orange-500" />
          </div>
          <div className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider`}>Total Value</div>
        </div>
        <div className={`text-3xl font-bold ${theme.text} mb-2`}>
          {portfolioValue || '$0.00'}
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            if (!change24h || typeof change24h.percentage !== 'number') return null;
            
            return (
              <>
                {change24h.percentage >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  change24h.percentage >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {change24h.percentage >= 0 ? '+' : ''}
                  {change24h.percentage.toFixed(2)}%
                </span>
                <span className={`text-xs ${theme.textMuted}`}>24h</span>
              </>
            );
          })()}
        </div>
      </div>

      {/* 24h High Card */}
      <div className={`${theme.mainCard} border ${theme.cardBorder} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${theme.itemBg} group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors`}>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <div className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider`}>24h High</div>
        </div>
        <div className={`text-3xl font-bold text-green-600 mb-2`}>
          {get24hHigh()}
        </div>
        <div className={`text-xs ${theme.textMuted}`}>Peak portfolio value</div>
      </div>

      {/* 24h Low Card */}
      <div className={`${theme.mainCard} border ${theme.cardBorder} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${theme.itemBg} group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors`}>
            <TrendingDown className="w-6 h-6 text-red-500" />
          </div>
          <div className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wider`}>24h Low</div>
        </div>
        <div className={`text-3xl font-bold text-red-600 mb-2`}>
          {get24hLow()}
        </div>
        <div className={`text-xs ${theme.textMuted}`}>Lowest portfolio value</div>
      </div>
    </div>
  );
}