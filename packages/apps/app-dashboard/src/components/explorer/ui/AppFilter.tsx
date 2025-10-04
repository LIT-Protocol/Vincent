import { Search, Filter } from 'lucide-react';

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
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-black/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      <div className="relative bg-white/40 backdrop-blur-xl border border-black/10 rounded-2xl p-6 hover:border-black/20 transition-all duration-500">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/40" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/50 border border-black/10 focus:border-black/20 text-black placeholder-gray-500 transition-all duration-300 focus:outline-none"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-black/40" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/50 border border-black/10 text-black text-sm transition-all duration-300 focus:outline-none focus:border-black/20"
              >
                <option value="all">All Status</option>
                <option value="prod">Live</option>
                <option value="test">Beta</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/50 border border-black/10 text-black text-sm transition-all duration-300 focus:outline-none focus:border-black/20"
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
