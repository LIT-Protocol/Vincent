import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, Info } from 'lucide-react';
import { StatusMessage } from '@/utils/statusMessage';
import createVersion from '@/api/app/createVersion';

// Sample predefined tools - In a real app, these would come from an API
const AVAILABLE_TOOLS = [
  {
    name: 'Weather API Tool',
    toolIpfsCid: 'QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY',
    toolPackageName: 'weather-api-tool',
    toolVersion: '1.0.0',
    policies: [
      {
        policyIpfsCid: 'weatherPolicy1',
        parameters: [
          { name: 'location', type: 'string' },
          { name: 'units', type: 'string' },
        ],
      },
    ],
  },
  {
    name: 'Document Processing Tool',
    toolIpfsCid: 'QmWHAQiA2HzJKqemYxUQE6WW55ZqVX4542ZUPTCjoAsPFJ',
    toolPackageName: 'document-processing-tool',
    toolVersion: '1.2.1',
    policies: [
      {
        policyIpfsCid: 'docPolicy1',
        parameters: [
          { name: 'format', type: 'string' },
          { name: 'maxSize', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'Payment Processing Tool',
    toolIpfsCid: 'QmT7fAT9CXEYMrttS9LcuiMjEK3gfQEsLY6pZ4kWKTuUcc',
    toolPackageName: 'payment-processing-tool',
    toolVersion: '2.0.0',
    policies: [
      {
        policyIpfsCid: 'paymentPolicy1',
        parameters: [
          { name: 'amount', type: 'uint256' },
          { name: 'recipient', type: 'address' },
        ],
      },
    ],
  },
  {
    name: 'NLP Analysis Tool',
    toolIpfsCid: 'QmX8Y2ZHJgNbWcWr7ZKmHQyFrvEBCzYrJu1TdFQSeqmgL7',
    toolPackageName: 'nlp-analysis-tool',
    toolVersion: '1.1.0',
    policies: [
      {
        policyIpfsCid: 'nlpPolicy1',
        parameters: [
          { name: 'language', type: 'string' },
          { name: 'maxLength', type: 'uint256' },
          { name: 'sensitivityLevel', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'Image Recognition Tool',
    toolIpfsCid: 'QmRjHT2u2aPv9BG8yBcPaRjpHZbwrQpSB2eXH2jpgJzw57',
    toolPackageName: 'image-recognition-tool',
    toolVersion: '3.0.1',
    policies: [
      {
        policyIpfsCid: 'imagePolicy1',
        parameters: [
          { name: 'minConfidence', type: 'uint256' },
          { name: 'categories', type: 'string[]' },
        ],
      },
    ],
  },
];

interface CreateVersionProps {
  appId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateVersion({ appId, isOpen, onClose, onSuccess }: CreateVersionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [changes, setChanges] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
  } | null>(null);

  const filteredTools = AVAILABLE_TOOLS.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.toolIpfsCid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.toolPackageName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToolToggle = (toolIpfsCid: string) => {
    if (selectedTools.includes(toolIpfsCid)) {
      setSelectedTools(selectedTools.filter((id) => id !== toolIpfsCid));
    } else {
      setSelectedTools([...selectedTools, toolIpfsCid]);
    }
  };

  const resetForm = () => {
    setChanges('');
    setSelectedTools([]);
    setSearchTerm('');
    setStatusMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setStatusMessage({ message: 'Creating new version...', type: 'info' });

      // Validate form
      if (!changes.trim()) {
        setStatusMessage({ message: 'Please enter changes for this version', type: 'error' });
        setIsSubmitting(false);
        return;
      }

      // Validate tools
      if (selectedTools.length === 0) {
        setStatusMessage({ message: 'Please select at least one tool', type: 'error' });
        setIsSubmitting(false);
        return;
      }

      // Get the full tool objects from the selected IDs
      const toolsToCreate = selectedTools.map((toolId) => {
        const tool = AVAILABLE_TOOLS.find((t) => t.toolIpfsCid === toolId);
        if (!tool) throw new Error(`Tool with ID ${toolId} not found`);
        return {
          toolIpfsCid: tool.toolIpfsCid,
          toolPackageName: tool.toolPackageName,
          toolVersion: tool.toolVersion,
          policies: tool.policies,
        };
      });

      // Submit the new version
      const result = await createVersion(appId, changes, toolsToCreate);

      if (result.success) {
        setStatusMessage({ message: result.message, type: 'success' });

        // Reset and close after a delay on success
        setTimeout(() => {
          handleClose();
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setStatusMessage({ message: result.message, type: 'error' });
      }
    } catch (error) {
      console.error('Error creating version:', error);
      setStatusMessage({
        message: `Error creating version: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [appId, changes, selectedTools, onSuccess]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create New Version</DialogTitle>
        </DialogHeader>

        {statusMessage && (
          <StatusMessage message={statusMessage.message} type={statusMessage.type} />
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="changes">Version Changes</Label>
            <Textarea
              id="changes"
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              placeholder="Describe the changes in this version"
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Select Tools</h3>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 px-2 py-0"
                  title="Select tools to include in this version"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                type="text"
                placeholder="Search for tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
              {filteredTools.length === 0 ? (
                <p className="text-sm text-gray-500 p-2">No tools match your search</p>
              ) : (
                filteredTools.map((tool) => (
                  <div key={tool.toolIpfsCid} className="flex items-start p-2 border rounded-md">
                    <input
                      type="checkbox"
                      id={`tool-${tool.toolIpfsCid}`}
                      checked={selectedTools.includes(tool.toolIpfsCid)}
                      onChange={() => handleToolToggle(tool.toolIpfsCid)}
                      className="mt-1 mr-2"
                    />
                    <label htmlFor={`tool-${tool.toolIpfsCid}`} className="flex-1">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs text-gray-500 truncate">{tool.toolIpfsCid}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Package: {tool.toolPackageName}@{tool.toolVersion}
                      </div>
                      <div className="text-xs text-gray-600">
                        {tool.policies.length} {tool.policies.length === 1 ? 'policy' : 'policies'}{' '}
                        with{' '}
                        {tool.policies.reduce((acc, policy) => acc + policy.parameters.length, 0)}{' '}
                        parameters
                      </div>
                    </label>
                  </div>
                ))
              )}
            </div>

            {selectedTools.length > 0 && (
              <div className="text-sm text-blue-600">
                {selectedTools.length} tool{selectedTools.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Version'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
