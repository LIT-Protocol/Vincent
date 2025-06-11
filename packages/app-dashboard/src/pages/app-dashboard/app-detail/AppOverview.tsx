import { useNavigate } from 'react-router';
import { useAccount } from 'wagmi';
import { AppDetailsView } from '@/components/app-dashboard/AppDetailsView';
import { StatusMessage } from '@/utils/shared/statusMessage';
import Loading from '@/layout/app-dashboard/Loading';
import { useAppDetail } from '@/components/app-dashboard/AppDetailContext';

export default function AppOverview() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { appId, app, appError, appLoading } = useAppDetail();

  // Loading state
  if (appLoading) return <Loading />;

  // Error handling
  if (appError || !app) {
    return <StatusMessage message="App not found" type="error" />;
  }

  // Authorization check
  if (app.managerAddress.toLowerCase() !== address?.toLowerCase()) {
    navigate('/developer');
  }

  return (
    <AppDetailsView
      selectedApp={app}
      onOpenModal={(modalType: string) => navigate(`/appId/${appId}/${modalType}`)}
    />
  );
}
