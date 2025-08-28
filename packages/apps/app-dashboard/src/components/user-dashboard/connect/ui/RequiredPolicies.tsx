import { FileText } from 'lucide-react';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { Logo } from '@/components/shared/ui/Logo';
import { PolicyForm, PolicyFormRef } from './PolicyForm';
import { theme } from './theme';
import { PolicyVersion } from '@/types/developer-dashboard/appTypes';

interface RequiredPoliciesProps {
  policies: Array<PolicyVersion>;
  connectInfoMap: ConnectInfoMap;
  formData: Record<string, any>;
  onFormChange: (abilityIpfsCid: string, policyIpfsCid: string, data: any) => void;
  onRegisterFormRef: (policyIpfsCid: string, ref: PolicyFormRef) => void;
  abilityIpfsCid: string;
  selectedPolicies: Record<string, boolean>;
  onPolicySelectionChange: (
    abilityIpfsCid: string,
    policyIpfsCid: string,
    selected: boolean,
  ) => void;
}

export function RequiredPolicies({
  policies,
  connectInfoMap,
  formData,
  onFormChange,
  onRegisterFormRef,
  abilityIpfsCid,
  selectedPolicies,
  onPolicySelectionChange,
}: RequiredPoliciesProps) {
  if (policies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mt-3">
      {policies.map((policy) => {
        const policyData = connectInfoMap.policiesByPackageName[policy.packageName];

        const isSelected = selectedPolicies[policy.ipfsCid] ?? true; // Default to selected

        return (
          <div key={policy.ipfsCid} className="">
            <div className="flex items-start gap-3">
              {/* Logo */}
              <div className="flex items-center">
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
              <div className="flex-1 -mt-2">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-semibold ${theme.text}`}>
                    {connectInfoMap.policiesByPackageName[policy.packageName]?.title ||
                      policy.packageName}
                  </h4>
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
                {connectInfoMap.policiesByPackageName[policy.packageName]?.description && (
                  <p className={`text-xs ${theme.textSubtle} mt-1`}>
                    {connectInfoMap.policiesByPackageName[policy.packageName].description}
                  </p>
                )}
              </div>

              {/* Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`policy-${policy.ipfsCid}`}
                  checked={isSelected}
                  onChange={(e) =>
                    onPolicySelectionChange(abilityIpfsCid, policy.ipfsCid, e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Form - Only show when selected */}
            {isSelected && (
              <div className="mt-3">
                {/* Policy Form */}
                <PolicyForm
                  ref={(ref) => {
                    if (ref) {
                      onRegisterFormRef(policy.ipfsCid, ref);
                    }
                  }}
                  policy={policy}
                  formData={formData[abilityIpfsCid] || {}}
                  onFormChange={(policyIpfsCid, data) => {
                    onFormChange(abilityIpfsCid, policyIpfsCid, data);
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
