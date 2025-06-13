import { useNavigate } from 'react-router';
import { ToolsList } from '../../components/app-dashboard/ResourceLists';
import { useDashboard } from '../../components/app-dashboard/DashboardContext';

export default function ToolsPage() {
  const navigate = useNavigate();
  const { tools, loading, errors } = useDashboard();

  return (
    <ToolsList
      tools={tools}
      isLoading={loading.tools}
      error={errors.tools}
      onCreateClick={() => navigate('/create-tool')}
    />
  );
}
