import { FileText } from 'lucide-react';
import { ConsentInfoMap } from '@/hooks/user-dashboard/consent/useConsentInfo';
import { Card, CardContent } from '@/components/shared/ui/card';
import { PolicyForm, PolicyFormRef } from './PolicyForm';
import { ThemeType } from './theme';
import { PolicyVersion } from '@/types/developer-dashboard/appTypes';

interface RequiredPoliciesProps {
  policies: Array<PolicyVersion>;
  consentInfoMap: ConsentInfoMap;
  theme: ThemeType;
  isDark: boolean;
  formData: Record<string, any>;
  onFormChange: (toolIpfsCid: string, policyIpfsCid: string, data: any) => void;
  onRegisterFormRef: (policyIpfsCid: string, ref: PolicyFormRef) => void;
  toolIpfsCid: string;
}

export function RequiredPolicies({
  policies,
  consentInfoMap,
  theme,
  isDark,
  formData,
  onFormChange,
  onRegisterFormRef,
  toolIpfsCid,
}: RequiredPoliciesProps) {
  if (policies.length === 0) {
    return null;
  }

  return (
    <div className="ml-4 space-y-3">
      <h5 className={`text-sm font-semibold ${theme.text} mb-3`}>Policies:</h5>
      {policies.map((policy) => (
        <Card key={policy.ipfsCid} className={`${theme.itemBg} border ${theme.cardBorder} ml-4`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${theme.iconBg} border ${theme.iconBorder}`}>
                <FileText className={`w-4 h-4 ${theme.textMuted}`} />
              </div>
              <div className="flex-1">
                <h6 className={`font-semibold ${theme.text}`}>
                  {consentInfoMap.policiesByPackageName[policy.packageName]?.title ||
                    policy.packageName}
                </h6>
                <div
                  className={`flex items-center gap-2 text-sm ${theme.textMuted} font-medium mt-1`}
                >
                  <span>
                    {policy.packageName} - v{policy.version}
                  </span>
                  <a
                    href={`https://www.npmjs.com/package/${policy.packageName}/v/${policy.version}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75 transition-opacity"
                    title={`View ${policy.packageName} on npm`}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      <img src="/npm.png" alt="npm" className="w-full h-full object-contain" />
                    </div>
                  </a>
                  <a
                    href={`https://ipfs.io/ipfs/${policy.ipfsCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75 transition-opacity"
                    title={`View ${policy.ipfsCid} on IPFS`}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      <img src="/ipfs.png" alt="IPFS" className="w-full h-full object-contain" />
                    </div>
                  </a>
                </div>
                {consentInfoMap.policiesByPackageName[policy.packageName]?.description && (
                  <p className={`text-sm ${theme.textSubtle} mt-2`}>
                    {consentInfoMap.policiesByPackageName[policy.packageName].description}
                  </p>
                )}

                {/* Policy Form */}
                <PolicyForm
                  ref={(ref) => {
                    if (ref) {
                      onRegisterFormRef(policy.ipfsCid, ref);
                    }
                  }}
                  policy={policy}
                  isDark={isDark}
                  formData={formData[toolIpfsCid] || {}}
                  onFormChange={(policyIpfsCid, data) => {
                    onFormChange(toolIpfsCid, policyIpfsCid, data);
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
