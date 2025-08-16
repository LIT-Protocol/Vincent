import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { useZerionPortfolio } from '@/hooks/user-dashboard/dashboard/useZerionPortfolio';
import { useZerionCharts } from '@/hooks/user-dashboard/dashboard/useZerionCharts';
import { useZerionPositions } from '@/hooks/user-dashboard/dashboard/useZerionPositions';
import { PortfolioTabs } from './PortfolioTabs';

type AppPortfolioPageProps = {
  agentAddress: string;
  appName: string;
};

export function AppPortfolioPage({ agentAddress, appName }: AppPortfolioPageProps) {
  const navigate = useNavigate();
  
  // Zerion hooks
  const { data: portfolioData, isLoading: portfolioLoading, error: portfolioError } = useZerionPortfolio({
    address: agentAddress
  });
  
  const { data: chartsData, isLoading: chartsLoading, error: chartsError } = useZerionCharts({
    address: agentAddress,
    period: 'day'
  });

  const { data: positionsData, isLoading: positionsLoading, error: positionsError } = useZerionPositions({
    address: agentAddress
  });

  // Console log the data
  useEffect(() => {
    if (portfolioData) {
      console.log('App Portfolio - Portfolio Data:', portfolioData);
    }
  }, [portfolioData]);

  useEffect(() => {
    if (chartsData) {
      console.log('App Portfolio - Charts Data:', chartsData);
    }
  }, [chartsData]);

  // Helper functions
  const getPortfolioValue = () => {
    if (!portfolioData?.data?.attributes?.total?.positions) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(portfolioData.data.attributes.total.positions);
  };

  const get24hChange = () => {
    if (!portfolioData?.data?.attributes?.changes) return null;
    const { percent_1d, absolute_1d } = portfolioData.data.attributes.changes;
    return {
      percentage: percent_1d,
      absolute: absolute_1d,
    };
  };

  const formatChartData = () => {
    if (!chartsData?.data?.attributes?.points) return [];
    return chartsData.data.attributes.points.map((point: { timestamp: number; value: number }) => ({
      time: new Date(point.timestamp * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      value: point.value,
      fullTime: new Date(point.timestamp * 1000),
    }));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="px-6 py-8">
        {/* Main Container - No background */}
        <div className="w-full">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center text-sm font-mono mb-3">
            <span className={`${theme.textMuted} select-none opacity-60`}>~/</span>
            <button 
              onClick={() => navigate('/user/apps')}
              className={`${theme.text} hover:text-orange-500 transition-all duration-200 cursor-pointer lowercase hover:scale-105 font-medium`}
            >
              home
            </button>
            <span className={`${theme.textMuted} mx-2 opacity-60`}>/</span>
            <span className="text-orange-500 lowercase font-semibold">{appName}</span>
          </div>
          
          {/* Page Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mini Stats */}
              <div className="flex items-center gap-3 text-sm">
                <div className="text-right">
                  <div className={`text-xs ${theme.textMuted}`}>Total</div>
                  <div className={`font-semibold ${theme.text}`}>{getPortfolioValue() || '$0.00'}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs ${theme.textMuted}`}>24h</div>
                  <div className={`font-semibold ${get24hChange()?.percentage && get24hChange()!.percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {get24hChange() ? `${get24hChange()!.percentage >= 0 ? '+' : ''}${get24hChange()!.percentage.toFixed(2)}%` : '0.00%'}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs ${theme.textMuted}`}>High</div>
                  <div className={`font-semibold ${theme.text}`}>
                    {(() => {
                      const currentValue = getPortfolioValue() ? parseFloat(getPortfolioValue()!.replace(/[$,]/g, '')) : 0;
                      const chartData = formatChartData();
                      if (chartData.length === 0) return `$${currentValue.toFixed(2)}`;
                      const validValues = chartData.map(d => d.value).filter(v => v > 0);
                      const maxValue = validValues.length > 0 ? Math.max(...validValues, currentValue) : currentValue;
                      return `$${maxValue.toFixed(2)}`;
                    })()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs ${theme.textMuted}`}>Low</div>
                  <div className={`font-semibold ${theme.text}`}>
                    {(() => {
                      const currentValue = getPortfolioValue() ? parseFloat(getPortfolioValue()!.replace(/[$,]/g, '')) : 0;
                      const chartData = formatChartData();
                      if (chartData.length === 0) return `$${currentValue.toFixed(2)}`;
                      const validValues = chartData.map(d => d.value).filter(v => v > 0);
                      const minValue = validValues.length > 0 ? Math.min(...validValues, currentValue) : currentValue;
                      return `$${minValue.toFixed(2)}`;
                    })()}
                  </div>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${theme.itemBg} ${theme.text} border ${theme.cardBorder}`}>
                Agent: {agentAddress.slice(0, 6)}...{agentAddress.slice(-4)}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

          {/* Loading State */}
          {(portfolioLoading || chartsLoading || positionsLoading) && (
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-orange-500 mx-auto"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-r-orange-300 animate-pulse"></div>
              </div>
              <h3 className={`text-xl font-semibold mt-6 ${theme.text}`}>Loading Portfolio</h3>
              <p className={`text-sm ${theme.textMuted} mt-2`}>Fetching real-time blockchain data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {(portfolioError || chartsError || positionsError) && (
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${theme.text}`}>Unable to Load Data</h3>
              <p className={`text-sm ${theme.textMuted} leading-relaxed`}>
                {portfolioError || chartsError || positionsError}
              </p>
            </div>
          </div>
        )}

        {/* Main Dashboard Content */}
        {!portfolioLoading && !chartsLoading && !positionsLoading && !portfolioError && !chartsError && !positionsError && (
          <div className="space-y-8">
            {/* Portfolio Tabs - Token Distribution, Individual Assets & Chart */}
            <PortfolioTabs 
              positions={positionsData?.data || []} 
              chartData={formatChartData()}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}