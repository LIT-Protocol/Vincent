import { useNavigate } from 'react-router';
import { AppsList } from '@/components/developer-dashboard/ui/ResourceLists';
import { App } from '@/types/developer-dashboard/appTypes';

export default function AppsPage() {
  const navigate = useNavigate();

  return (
    <AppsList
      onCreateClick={() => navigate('/developer/create-app')}
      onAppClick={(app: App) => navigate(`/developer/appId/${app.appId}`)}
    />
  );
}
