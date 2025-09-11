import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card';
import { AppVersion, AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { AppVersionAbilitiesDisplay } from '@/components/developer-dashboard/app/views/AppVersionAbilitiesDisplay.tsx';

interface VersionDetailsProps {
  version: number;
  appName?: string;
  versionData: AppVersion;
  abilities: AppVersionAbility[];
}

export function VersionDetails({ version, versionData, abilities }: VersionDetailsProps) {
  if (!versionData) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Version Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Version {version} not found for this app.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {versionData.changes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-neutral-800 dark:text-white">Version Changes</CardTitle>
            <CardDescription className="text-gray-700 dark:text-white/60">
              What's new in this version
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border dark:border-white/10">
              <p className="text-neutral-800 dark:text-white text-sm whitespace-pre-wrap">
                {versionData.changes}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-neutral-800 dark:text-white">Associated Abilities</CardTitle>
          <CardDescription className="text-gray-700 dark:text-white/60">
            Abilities included in this version
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppVersionAbilitiesDisplay abilities={abilities} />
        </CardContent>
      </Card>
    </div>
  );
}
