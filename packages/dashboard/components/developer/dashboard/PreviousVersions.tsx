import { VincentApp } from '@/services/types';
import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { VincentContracts } from '@/services';

interface PreviousVersionsProps {
  onBack: () => void;
  dashboard: VincentApp;
  onSuccess: () => void;
}

interface AppVersion {
  version: number;
  enabled: boolean;
  tools: {
    toolIpfsCid: string;
    policies: {
      policyIpfsCid: string;
      policySchemaIpfsCid: string;
      parameterNames: string[];
    }[];
  }[];
}

export default function PreviousVersionsScreen({
  onBack,
  dashboard,
  onSuccess,
}: PreviousVersionsProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleVersion = async (version: number, currentEnabled: boolean) => {
    if (!version) return;

    try {
      setIsToggling(true);
      const contracts = new VincentContracts('datil');
      await contracts.enableAppVersion(dashboard.appId, version, !currentEnabled);
      onSuccess();
    } catch (error) {
      console.error('Error toggling version:', error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Previous Versions</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {[...dashboard.versions].reverse().map((versionData) => (
          <Card key={versionData.version}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Version {versionData.version}</CardTitle>
                  <CardDescription>
                    {versionData.toolPolicies.length} Tool Policies
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={versionData.enabled ? 'default' : 'secondary'}>
                    {versionData.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Button
                    variant="default"
                    onClick={() => handleToggleVersion(versionData.version, versionData.enabled)}
                    disabled={isToggling}
                  >
                    {isToggling
                      ? 'Updating...'
                      : versionData.enabled
                      ? 'Disable Version'
                      : 'Enable Version'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {versionData.toolPolicies.map((tool, toolIndex) => (
                  <Card key={toolIndex}>
                    <CardHeader>
                      <CardTitle>Tool Policy {toolIndex + 1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Tool IPFS CID:</span>{' '}
                          <a 
                            href={`/ipfs/${tool.toolIpfsCid}`}
                            className="text-black hover:text-gray-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                            rel="noopener noreferrer"
                          >
                            {tool.toolIpfsCid}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="text-sm space-y-2">
                          {tool.policies.map((policy, policyIndex) => (
                            <div key={policyIndex} className="border rounded-lg p-3 space-y-2">
                              <div className="space-y-1">
                                <div>
                                  <span className="font-medium">Policy IPFS CID:</span>{' '}
                                  <a 
                                    href={`/ipfs/${policy.policyIpfsCid}`}
                                    className="text-black hover:text-gray-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                                    rel="noopener noreferrer"
                                  >
                                    {policy.policyIpfsCid}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                                <div>
                                  <span className="font-medium">Schema IPFS CID:</span>{' '}
                                  <a 
                                    href={`/ipfs/${policy.policySchemaIpfsCid}`}
                                    className="text-black hover:text-gray-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                                    rel="noopener noreferrer"
                                  >
                                    {policy.policySchemaIpfsCid}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                                <div>
                                  <span className="font-medium">Parameter Names:</span>{' '}
                                  {policy.parameterNames.length === 0 ? (
                                    <span className="text-gray-600">None</span>
                                  ) : (
                                    <span className="text-black">{policy.parameterNames.join(', ')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 