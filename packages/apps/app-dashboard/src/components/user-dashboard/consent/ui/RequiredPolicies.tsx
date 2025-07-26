import { FileText } from 'lucide-react';
import { ConsentInfoMap } from '@/hooks/user-dashboard/consent/useConsentInfo';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Logo } from '@/components/shared/ui/Logo';
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
    <div className="ml-0 sm:ml-4 space-y-3">
      {policies.map((policy) => {
        const policyData = consentInfoMap.policiesByPackageName[policy.packageName];

        return (
          <Card
            key={policy.ipfsCid}
            className={`${theme.itemBg} border ${theme.cardBorder} ml-0 sm:ml-4`}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center mt-0.5">
                  {policyData?.logo && policyData.logo.length >= 10 ? (
                    <Logo
                      logo={policyData.logo}
                      alt={`${policy.packageName} logo`}
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <FileText className={`w-6 h-6 ${theme.textMuted}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h6 className={`font-semibold ${theme.text}`}>
                      {consentInfoMap.policiesByPackageName[policy.packageName]?.title ||
                        policy.packageName}
                    </h6>
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
                </div>
              </div>

              {/* Description and Form - spans full width including under icon */}
              <div className="mt-2">
                {consentInfoMap.policiesByPackageName[policy.packageName]?.description && (
                  <p className={`text-sm ${theme.textSubtle} mb-3`}>
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
