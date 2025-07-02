import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/utils/developer-dashboard/formatDateAndTime';
import { UndeleteToolButton } from '../wrappers';
import { Tool } from '@/types/developer-dashboard/appTypes';

interface ToolsListViewProps {
  tools: Tool[];
  deletedTools: Tool[];
}

export function ToolsListView({ tools, deletedTools }: ToolsListViewProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Your Tools</h1>
      </div>

      {tools.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">No Tools Yet</h2>
          <p className="text-gray-600 mb-6">Create your first tool to get started with Vincent.</p>
          <Button
            variant="outline"
            className="text-gray-700"
            onClick={() => navigate('/developer/create-tool')}
          >
            <Plus className="h-4 w-4 mr-2 font-bold text-gray-700" />
            Create Tool
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tools.map((tool) => (
            <Card
              key={tool.packageName}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/developer/toolId/${encodeURIComponent(tool.packageName)}`)}
            >
              <CardHeader>
                <CardTitle className="text-gray-900">{tool.packageName}</CardTitle>
                <CardDescription className="text-gray-700">
                  {tool.description || 'No description available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">Version:</span> {tool.activeVersion}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {formatDate(tool.createdAt)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Deleted Tools Section */}
      {deletedTools && deletedTools.length > 0 && (
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-600 mb-4">Deleted Tools</h3>
            <div className="grid grid-cols-1 gap-4">
              {deletedTools.map((tool) => (
                <Card key={tool.packageName} className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-start text-gray-600">
                      <div className="flex items-center gap-3">
                        <span className="line-through">{tool.packageName}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-400">
                          DELETED
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                          v{tool.activeVersion}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UndeleteToolButton tool={tool} />
                      </div>
                    </CardTitle>
                    <CardDescription className="text-gray-500 line-through">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-sm text-gray-500">
                      <div className="space-y-1">
                        <div>
                          <span className="font-medium">Version:</span> {tool.activeVersion}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {formatDate(tool.createdAt)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
