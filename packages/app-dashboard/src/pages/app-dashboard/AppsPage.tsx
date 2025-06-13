import { useNavigate } from 'react-router';
import { AppsList } from '../../components/app-dashboard/ResourceLists';
import { useDashboard } from '../../components/app-dashboard/DashboardContext';
import { useAppFilters } from '../../hooks/app-dashboard/useAppFilters';

export default function AppsPage() {
  const navigate = useNavigate();
  const { loading, errors } = useDashboard();
  const { sortOption, setSortOption, filteredApps } = useAppFilters();

  return (
    <AppsList
      apps={filteredApps}
      isLoading={loading.apps}
      error={errors.apps}
      sortOption={sortOption}
      onSortChange={setSortOption}
      onCreateClick={() => navigate('/create-app')}
      onAppClick={(app: any) => navigate(`/appId/${app.appId}`)}
    />
  );
}
