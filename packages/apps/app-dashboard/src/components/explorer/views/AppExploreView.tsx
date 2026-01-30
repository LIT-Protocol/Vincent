import { Helmet } from 'react-helmet-async';
import { App } from '@/types/developer-dashboard/appTypes';
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppsDisplay } from '../ui/AppsDisplay';
import { AppFilter } from '../ui/AppFilter';
import { ExplorerNav } from '../ui/ExplorerNav';
import { FeaturedApps } from '../ui/FeaturedApps';
import { theme, fonts } from '@/lib/themeClasses';
import { env } from '@/config/env';

const { VITE_OFFICIAL_APP_IDS } = env;

interface ExploreViewProps {
  apps: App[];
}

export function AppExploreView({ apps }: ExploreViewProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'official' | 'all' | 'prod' | 'test'>(
    'official',
  );
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'version'>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [showContent, setShowContent] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const appsPerPage = 9;

  const officialAppIds = VITE_OFFICIAL_APP_IDS
    ? VITE_OFFICIAL_APP_IDS.split(',').map((id: string) => Number(id.trim()))
    : [];

  useEffect(() => {
    const fromTransition = location.state?.fromTransition;
    if (fromTransition) {
      setTimeout(() => setShowContent(true), 100);
    } else {
      setShowContent(true);
    }
  }, [location.state]);

  const filteredApps = apps
    .filter((app) => {
      const matchesSearch =
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description?.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesStatus = false;
      if (statusFilter === 'official') {
        matchesStatus = officialAppIds.includes(app.appId);
      } else if (statusFilter === 'all') {
        matchesStatus = true;
      } else {
        matchesStatus = app.deploymentStatus === statusFilter;
      }

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'version':
          return (b.activeVersion || 0) - (a.activeVersion || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const totalPages = Math.ceil(filteredApps.length / appsPerPage);
  const startIndex = (currentPage - 1) * appsPerPage;
  const endIndex = startIndex + appsPerPage;
  const paginatedApps = filteredApps.slice(startIndex, endIndex);

  const handleFilterChange =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setCurrentPage(1);
    };

  // Transition helper for navigation
  const handleNavigateWithTransition = useCallback(
    (path: string) => {
      setIsTransitioning(true);
      setTimeout(() => {
        navigate(path, { state: { fromTransition: true } });
      }, 500);
    },
    [navigate],
  );

  return (
    <>
      <Helmet>
        <title>Vincent | App Explorer</title>
        <meta name="description" content="Explore and discover intelligent finance applications" />
      </Helmet>

      <div className={`w-full relative z-10 ${theme.text}`}>
        {/* Navigation */}
        <ExplorerNav onNavigate={handleNavigateWithTransition} />

        {/* Content wrapper with top padding for fixed navbar */}
        <div
          className={`pt-20 transition-opacity duration-500 ${showContent && !isTransitioning ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Hero Title */}
          <div className="mb-8 md:mb-12">
            <h1
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light ${theme.text} mb-3 md:mb-4 leading-tight`}
              style={fonts.heading}
            >
              App Explorer
            </h1>
            <p
              className={`text-base md:text-lg ${theme.text} opacity-60 max-w-2xl leading-relaxed`}
              style={fonts.body}
            >
              Discover intelligent applications that work autonomously on your behalf
            </p>
          </div>

          {/* Featured Apps Section */}
          <FeaturedApps apps={apps} onNavigate={handleNavigateWithTransition} />

          {/* All Apps Section */}
          <div className="mb-6 md:mb-8">
            <h2
              className={`text-2xl md:text-3xl font-semibold ${theme.text} mb-4 md:mb-6`}
              style={fonts.heading}
            >
              All Apps
            </h2>

            {/* Filters and Search */}
            <AppFilter
              searchQuery={searchQuery}
              setSearchQuery={handleFilterChange(setSearchQuery)}
              statusFilter={statusFilter}
              setStatusFilter={handleFilterChange((value: string) =>
                setStatusFilter(value as 'all' | 'prod' | 'test'),
              )}
              sortBy={sortBy}
              setSortBy={handleFilterChange((value: string) =>
                setSortBy(value as 'name' | 'updated' | 'version'),
              )}
            />
          </div>

          {/* Applications Display */}
          <AppsDisplay apps={paginatedApps} onNavigate={handleNavigateWithTransition} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg border ${theme.cardBorder} ${theme.text} text-sm transition-all duration-300 ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
                }`}
                style={fonts.heading}
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg text-sm transition-all duration-300 ${
                      currentPage === page
                        ? 'text-white'
                        : `${theme.text} hover:bg-gray-100 dark:hover:bg-gray-800`
                    }`}
                    style={{
                      ...fonts.heading,
                      backgroundColor: currentPage === page ? theme.brandOrange : 'transparent',
                      border: currentPage === page ? 'none' : `1px solid var(--tw-border-opacity)`,
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg border ${theme.cardBorder} ${theme.text} text-sm transition-all duration-300 ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
                }`}
                style={fonts.heading}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
