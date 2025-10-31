import { Search, Filter } from 'lucide-react';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

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
  statusFilter: 'official' | 'all' | 'prod' | 'test';
  setStatusFilter: (statusFilter: string) => void;
  sortBy: 'name' | 'updated' | 'version';
  setSortBy: (sortBy: string) => void;
}) {
  return (
    <div className="relative group">
      <div
        className={`relative ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl p-6 ${theme.cardHoverBorder} transition-all duration-500`}
      >
        <div className="flex flex-col lg:flex-row items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme.textMuted}`}
            />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl ${theme.itemBg} border ${theme.cardBorder} ${theme.text} ${theme.textMuted} transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF4205]`}
              style={fonts.body}
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className={`w-4 h-4 ${theme.textMuted}`} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border ${theme.cardBorder} ${theme.text} text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF4205] hover:border-gray-300 dark:hover:border-white/20 cursor-pointer`}
                style={fonts.heading}
              >
                <option
                  value="official"
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  Official
                </option>
                <option
                  value="prod"
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  Live
                </option>
                <option
                  value="test"
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  Beta
                </option>
                <option
                  value="all"
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  All Apps
                </option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border ${theme.cardBorder} ${theme.text} text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF4205] hover:border-gray-300 dark:hover:border-white/20 cursor-pointer`}
              style={fonts.heading}
            >
              <option
                value="name"
                className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                Sort by Name
              </option>
              <option
                value="updated"
                className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                Sort by Updated
              </option>
              <option
                value="version"
                className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                Sort by Version
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
