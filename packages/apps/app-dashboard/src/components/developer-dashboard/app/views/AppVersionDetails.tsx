import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card';
import { AppVersion, AppVersionTool } from '@/types/developer-dashboard/appTypes';
import { AppVersionToolsDisplay } from '@/components/developer-dashboard/app/views/AppVersionToolsDisplay';

interface VersionDetailsProps {
  version: number;
  appName?: string;
  versionData: AppVersion;
  tools: AppVersionTool[];
}

export function VersionDetails({ version, versionData, tools }: VersionDetailsProps) {
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
            <CardTitle className="text-gray-900">Version Changes</CardTitle>
            <CardDescription className="text-gray-700">What's new in this version</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-gray-900 text-sm whitespace-pre-wrap">{versionData.changes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Associated Tools</CardTitle>
          <CardDescription className="text-gray-700">
            Tools included in this version
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppVersionToolsDisplay tools={tools} />
        </CardContent>
      </Card>
    </div>
  );
}
