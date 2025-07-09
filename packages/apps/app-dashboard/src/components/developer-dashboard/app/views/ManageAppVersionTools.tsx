import { Button } from '@/components/ui/button';
import { Edit, X } from 'lucide-react';
import {
  EditAppVersionToolButton,
  DeleteAppVersionToolButton,
  UndeleteAppVersionToolButton,
} from '../wrappers';
import { AppVersionTool } from '@/types/developer-dashboard/appTypes';
import { useState } from 'react';

interface ManageAppVersionToolsProps {
  tools: AppVersionTool[];
  deletedTools: AppVersionTool[];
  appId: number;
  versionId: number;
}

export function ManageAppVersionTools({
  tools,
  deletedTools,
  appId,
  versionId,
}: ManageAppVersionToolsProps) {
  const [editingTool, setEditingTool] = useState<string | null>(null);

  const handleEditTool = (toolPackageName: string) => {
    setEditingTool(toolPackageName);
  };

  const handleCancelEdit = () => {
    setEditingTool(null);
  };

  const handleEditSuccess = () => {
    setEditingTool(null);
  };

  if (tools.length === 0 && (!deletedTools || deletedTools.length === 0)) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No tools assigned to this app version yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Tools Section */}
      {tools.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No active tools assigned to this app version yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {tools.map((tool) => (
              <div key={tool.toolPackageName} className="bg-white border rounded-lg p-4">
                {editingTool === tool.toolPackageName ? (
                  // Edit mode - render wrapper
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <h4 className="font-medium text-gray-900">Edit {tool.toolPackageName}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <EditAppVersionToolButton
                      appId={appId}
                      versionId={versionId}
                      tool={tool}
                      onSuccess={handleEditSuccess}
                      onCancel={handleCancelEdit}
                    />
                  </div>
                ) : (
                  // Normal display mode
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{tool.toolPackageName}</h4>
                      <p className="text-sm text-gray-500">Version: {tool.toolVersion}</p>
                      {tool.hiddenSupportedPolicies && tool.hiddenSupportedPolicies.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Hidden policies: {tool.hiddenSupportedPolicies.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-400">
                        Added: {new Date(tool.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTool(tool.toolPackageName)}
                          className="h-8 px-2"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <DeleteAppVersionToolButton
                          appId={appId}
                          versionId={versionId}
                          tool={tool}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deleted Tools Section */}
      {deletedTools && deletedTools.length > 0 && (
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-600 mb-4">Deleted Tools</h3>
            <div className="grid gap-4">
              {deletedTools.map((tool) => (
                <div
                  key={tool.toolPackageName}
                  className="bg-white border border-dashed rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-600 line-through">
                          {tool.toolPackageName}
                        </h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-400">
                          DELETED
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 line-through">
                        Version: {tool.toolVersion}
                      </p>
                      {tool.hiddenSupportedPolicies && tool.hiddenSupportedPolicies.length > 0 && (
                        <p className="text-sm text-gray-400 mt-1 line-through">
                          Hidden policies: {tool.hiddenSupportedPolicies.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-xs text-gray-400">
                        Added: {new Date(tool.createdAt).toLocaleDateString()}
                      </div>
                      <div className="relative z-10 bg-white rounded-lg opacity-100">
                        <UndeleteAppVersionToolButton appVersionTool={tool} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
