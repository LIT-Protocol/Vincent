import { EditAppForm } from '@/components/developer-dashboard/AppForms';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/layout/Loading';
import { useAppDetail } from '@/components/developer-dashboard/AppDetailContext';
import { useAddressCheck } from '@/hooks/developer-dashboard/useAddressCheck';

export default function AppEdit() {
  const { app, appError, appLoading } = useAppDetail();
  console.log('app', app);

  useAddressCheck(app);

  // Loading state
  if (appLoading) return <Loading />;

  // Error handling
  if (appError || !app) {
    return <StatusMessage message="App not found" type="error" />;
  }

  return <EditAppForm appData={app} hideHeader={false} />;
}
