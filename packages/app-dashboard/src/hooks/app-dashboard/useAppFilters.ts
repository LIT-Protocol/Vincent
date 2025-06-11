import { useState, useMemo } from 'react';
import { useDashboard } from '../../components/app-dashboard/DashboardContext';

export function useAppFilters() {
  const [sortOption, setSortOption] = useState<string>('all');
  const { apps } = useDashboard();

  const filteredApps = useMemo(() => {
    if (sortOption === 'all') return apps;
    return apps.filter((app) => app.deploymentStatus === sortOption);
  }, [apps, sortOption]);

  return {
    sortOption,
    setSortOption,
    filteredApps,
  };
}
