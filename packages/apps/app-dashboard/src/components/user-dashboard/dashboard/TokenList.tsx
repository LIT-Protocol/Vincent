import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { ZerionPosition } from '@/hooks/user-dashboard/dashboard/useZerionPositions';

interface TokenListProps {
  positions: ZerionPosition[];
}

export function TokenList({ positions }: TokenListProps) {
  const formatTokenData = () => {
    if (!positions || positions.length === 0) return [];
    
    // Aggregate tokens by symbol
    const tokenMap = new Map<string, {
      symbol: string;
      name: string;
      value: number;
      icon?: string;
      networks: Set<string>;
    }>();
    
    positions.forEach((position) => {
      const symbol = position.attributes.fungible_info?.symbol || 'Unknown';
      const name = position.attributes.fungible_info?.name || 'Unknown Token';
      const value = position.attributes.value || 0;
      const icon = position.attributes.fungible_info?.icon?.url;
      
      // Try to extract network from position ID
      // Position IDs often contain network information
      // Format might be like "ethereum-0x..." or "base-0x..." etc.
      let network = 'unknown';
      
      if (position.id) {
        // Extract network from position ID if it contains a dash
        const parts = position.id.split('-');
        if (parts.length > 1) {
          network = parts[0];
        } else if (position.attributes.parent?.id) {
          // Fallback to parent ID
          const parentParts = position.attributes.parent.id.split('-');
          network = parentParts[0] || 'unknown';
        }
      }
      
      // Debug log to see what we're getting
      console.log(`Token: ${symbol}, Position ID: ${position.id}, Network: ${network}`);
      
      if (value > 0.01) {
        if (tokenMap.has(symbol)) {
          const existing = tokenMap.get(symbol)!;
          existing.value += value;
          existing.networks.add(network);
        } else {
          tokenMap.set(symbol, {
            symbol,
            name,
            value,
            icon,
            networks: new Set([network])
          });
        }
      }
    });
    
    return Array.from(tokenMap.values())
      .sort((a, b) => b.value - a.value);
  };

  const tokenData = formatTokenData();

  if (tokenData.length === 0) {
    return (
      <div className={`text-sm ${theme.textMuted} text-center py-8`}>
        No tokens found
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto">
      {tokenData.map((token) => (
        <div 
          key={token.symbol}
          className={`${theme.itemBg} rounded-lg p-4 border ${theme.cardBorder} ${theme.cardHoverBorder} transition-colors`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Token Logo */}
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {token.icon ? (
                  <img 
                    src={token.icon} 
                    alt={token.symbol}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-xs font-bold text-gray-500">
                    {token.symbol.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Token Info */}
              <div className="flex-1">
                <div className={`font-semibold ${theme.text}`}>{token.symbol}</div>
                <div className={`text-xs ${theme.textMuted}`}>{token.name}</div>
                <div className={`text-xs ${theme.textMuted} mt-0.5`}>
                  {token.networks.size} {token.networks.size === 1 ? 'network' : 'networks'}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {/* Balance */}
              <div className={`font-semibold ${theme.text}`}>
                ${token.value.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}