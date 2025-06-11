import { useNavigate } from 'react-router';
import { PoliciesList } from '../../components/app-dashboard/ResourceLists';
import { useDashboard } from '../../components/app-dashboard/DashboardContext';

export default function PoliciesPage() {
  const navigate = useNavigate();
  const { policies, loading, errors } = useDashboard();

  return (
    <PoliciesList
      policies={policies}
      isLoading={loading.policies}
      error={errors.policies}
      onCreateClick={() => navigate('/create-policy')}
    />
  );
}
