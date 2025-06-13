import { useAccount } from 'wagmi';
import { DeleteAppForm } from '@/components/app-dashboard/mock-forms/generic/AppForms';
import { StatusMessage } from '@/utils/shared/statusMessage';
import Loading from '@/layout/app-dashboard/Loading';
import { useAppDetail } from '@/components/app-dashboard/AppDetailContext';
import { useNavigate } from 'react-router';

export default function AppDelete() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { app, appError, appLoading } = useAppDetail();

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

  return <DeleteAppForm appData={app} hideHeader={false} />;
}
