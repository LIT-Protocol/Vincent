import { useState } from 'react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { TokenList } from './TokenList';
import { PortfolioPerformanceChart } from './PortfolioPerformanceChart';
import { ZerionPosition } from '@/hooks/user-dashboard/dashboard/useZerionPositions';

interface PortfolioTabsProps {
  positions: ZerionPosition[];
  chartData: Array<{ time: string; value: number; fullTime: Date }>;
}

type TabType = 'tokens' | 'chart';

export function PortfolioTabs({ positions, chartData }: PortfolioTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('tokens');

  const tabs = [
    { id: 'tokens', label: 'Token Distribution', icon: '🪙' },
    { id: 'chart', label: 'Chart', icon: '📈' },
  ];


  return (
    <div className={`bg-white dark:bg-neutral-900 border ${theme.cardBorder} rounded-2xl p-6 shadow-sm`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'tokens' && (
          <TokenList positions={positions} />
        )}
        
        {activeTab === 'chart' && (
          <div style={{ height: '320px' }}>
            <PortfolioPerformanceChart chartData={chartData} showHeader={false} />
          </div>
        )}
      </div>
    </div>
  );
}