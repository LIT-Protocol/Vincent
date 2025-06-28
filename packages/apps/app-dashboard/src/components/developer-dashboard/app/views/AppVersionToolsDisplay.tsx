import { AppVersionTool } from '@/types/developer-dashboard/appTypes';

interface AppVersionToolsDisplayProps {
  tools: AppVersionTool[];
}

export function AppVersionToolsDisplay({ tools }: AppVersionToolsDisplayProps) {
  if (tools.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-lg mb-2">📦</div>
        <p className="text-gray-600">No tools assigned to this app version yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tools.map((tool: AppVersionTool) => (
        <div key={tool.toolPackageName} className="p-4 bg-gray-50 rounded-lg border">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-medium text-gray-900">{tool.toolPackageName}</div>
              <div className="text-sm text-gray-600 mt-1">Version: {tool.toolVersion}</div>
            </div>
            <div className="text-xs text-gray-400">
              Added: {new Date(tool.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
