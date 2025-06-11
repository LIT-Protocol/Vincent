import { useNavigate } from 'react-router';
import { useAccount } from 'wagmi';
import { DeleteAppForm } from '@/components/app-dashboard/mock-forms/generic/AppForms';
import { StatusMessage } from '@/utils/shared/statusMessage';
import Loading from '@/layout/app-dashboard/Loading';
import { useAppDetail } from '@/components/app-dashboard/AppDetailContext';

export default function AppDelete() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { app, appError, appLoading } = useAppDetail();

  // Auth check
  if (!isConnected) {
    navigate('/');
    return null;
  }

  // Loading state
  if (appLoading) return <Loading />;

  // Error handling
  if (appError || !app) {
    return <StatusMessage message="App not found" type="error" />;
  }

  // Authorization check
  if (app.managerAddress.toLowerCase() !== address?.toLowerCase()) {
    return <StatusMessage message="Access denied" type="error" />;
  }

  return <DeleteAppForm appData={app} hideHeader={false} />;
}
