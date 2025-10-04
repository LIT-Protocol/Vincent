import { Helmet } from 'react-helmet-async';
import { App } from '@/types/developer-dashboard/appTypes';
import { useState } from 'react';
import { AppsDisplay } from '../ui/AppsDisplay';
import { AppFilter } from '../ui/AppFilter';
import { AppHero } from '../ui/AppHero';
import { Header } from '../ui/Header';

interface ExploreViewProps {
  apps: App[];
}

export function AppExploreView({ apps }: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'prod' | 'test'>('prod');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'version'>('name');

  const filteredApps = apps
    .filter((app) => {
      const matchesSearch =
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || app.deploymentStatus === statusFilter;
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

  return (
    <>
      <Helmet>
        <title>Vincent | Explorer</title>
        <meta name="description" content="Explore applications on your terms" />
      </Helmet>

      <div className="fixed inset-0 bg-white overflow-auto">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Navigation Header */}
          <Header />

          {/* Hero Section */}
          <AppHero apps={apps} />

          {/* Filters and Search */}
          <AppFilter
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={(value: string) => setStatusFilter(value as 'all' | 'prod' | 'test')}
            sortBy={sortBy}
            setSortBy={(value: string) => setSortBy(value as 'name' | 'updated' | 'version')}
          />

          {/* Applications Display */}
          <AppsDisplay apps={filteredApps} />
        </div>
      </div>
    </>
  );
}
