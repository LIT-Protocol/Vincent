import { Search, Filter } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { explorerTheme } from '@/utils/explorer/theme';

export function AppFilter({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
}: {
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
  statusFilter: 'all' | 'prod' | 'test';
  setStatusFilter: (statusFilter: string) => void;
  sortBy: 'name' | 'updated' | 'version';
  setSortBy: (sortBy: string) => void;
}) {
  const { isDark } = useTheme();
  const theme = explorerTheme(isDark);

  return (
    <div className="relative group">
      <div
        className={`absolute inset-0 ${theme.glowColor} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
      ></div>
      <div
        className={`relative ${theme.cardBg} backdrop-blur-xl border ${theme.cardBorder} rounded-2xl p-6 ${theme.cardHoverBorder} transition-all duration-500`}
      >
        <div className="flex flex-col lg:flex-row items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme.iconColorMuted}`}
            />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl ${theme.inputBg} border ${theme.inputBorder} ${theme.inputFocus} ${theme.text} placeholder-gray-500 transition-all duration-300 focus:outline-none`}
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className={`w-4 h-4 ${theme.iconColorMuted}`} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3 py-2 rounded-lg ${theme.inputBg} border ${theme.inputBorder} ${theme.text} text-sm transition-all duration-300 focus:outline-none ${theme.inputFocus}`}
              >
                <option value="all">All Status</option>
                <option value="prod">Production</option>
                <option value="test">Test</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3 py-2 rounded-lg ${theme.inputBg} border ${theme.inputBorder} ${theme.text} text-sm transition-all duration-300 focus:outline-none ${theme.inputFocus}`}
            >
              <option value="name">Sort by Name</option>
              <option value="updated">Sort by Updated</option>
              <option value="version">Sort by Version</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
