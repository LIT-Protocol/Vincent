import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Policy } from '@/types/developer-dashboard/appTypes';
import { Shield } from 'lucide-react';

interface ToolVersionInfoViewProps {
  supportedPolicies: Policy[];
}

export function ToolVersionInfoView({ supportedPolicies }: ToolVersionInfoViewProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Supported Policies ({supportedPolicies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {supportedPolicies.length === 0 ? (
            <p className="text-gray-500 text-sm">No supported policies found</p>
          ) : (
            <div className="space-y-4">
              {supportedPolicies.map((policy) => (
                <div key={policy.packageName} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{policy.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      v{policy.activeVersion}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{policy.description}</p>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {policy.packageName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
