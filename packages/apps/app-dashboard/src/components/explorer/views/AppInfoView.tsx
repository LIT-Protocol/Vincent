import { App } from '@/types/developer-dashboard/appTypes';

interface AppInfoViewProps {
  app: App;
}

export function AppInfoView({ app }: AppInfoViewProps) {
  return (
    <div>
      <h1>{app.name}</h1>
    </div>
  );
}
