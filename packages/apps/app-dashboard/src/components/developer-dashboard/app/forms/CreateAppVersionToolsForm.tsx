import { useState } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Tool } from '@/types/developer-dashboard/appTypes';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card';
import { ToolSelectorModal } from '../../ToolSelectorModal';
import { Plus } from 'lucide-react';

interface CreateAppVersionToolsFormProps {
  versionId: number;
  onToolAdd: (tool: Tool) => Promise<void>;
  existingTools?: string[]; // Array of package names already added
  availableTools: Tool[];
}

export function CreateAppVersionToolsForm({
  versionId,
  onToolAdd,
  existingTools = [],
  availableTools,
}: CreateAppVersionToolsFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToolAdd = async (tool: Tool) => {
    await onToolAdd(tool);
    setIsModalOpen(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add Tools to App Version</CardTitle>
        <CardDescription>
          Add tools to app version {versionId}. Tools will be added immediately when selected
          (except when clicking the package name).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-8">
          <Button type="button" onClick={() => setIsModalOpen(true)} className="px-6 py-3">
            <Plus className="h-4 w-4 mr-2" />
            Add Tools to Version
          </Button>
          <p className="text-sm text-gray-600 mt-2">
            Click to browse and add tools to this app version
          </p>
        </div>
      </CardContent>

      <ToolSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onToolAdd={handleToolAdd}
        existingTools={existingTools}
        availableTools={availableTools}
      />
    </Card>
  );
}
