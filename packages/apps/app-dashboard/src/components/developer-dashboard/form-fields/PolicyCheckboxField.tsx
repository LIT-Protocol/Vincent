import { Checkbox } from '@/components/shared/ui/checkbox';
import { Label } from '@/components/shared/ui/label';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Policy } from '@/types/developer-dashboard/appTypes';
import { PolicyWithVersion } from '@/utils/developer-dashboard/sortSupportedPolicies';
import { theme, fonts } from '@/lib/themeClasses';
import { Info } from 'lucide-react';
import { useState } from 'react';

interface PolicyCheckboxFieldProps {
  name: string;
  error?: string;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  label: string;
  required?: boolean;
  policies: (Policy | PolicyWithVersion)[];
}

export function PolicyCheckboxField({
  name,
  error,
  watch,
  setValue,
  label,
  required = false,
  policies,
}: PolicyCheckboxFieldProps) {
  const currentValues = watch(name) || [];
  const [showInfo, setShowInfo] = useState(false);

  const handleCheckboxChange = (policyPackageName: string, checked: boolean) => {
    let newValues: string[];
    if (checked) {
      newValues = currentValues.includes(policyPackageName)
        ? currentValues
        : [...currentValues, policyPackageName];
    } else {
      newValues = currentValues.filter((value: string) => value !== policyPackageName);
    }
    setValue(name, newValues);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className={theme.text} style={fonts.heading}>
          {label}
          {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
        </Label>
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="transition-opacity hover:opacity-75"
          title="Click for more information"
        >
          <Info className="h-4 w-4" style={{ color: theme.brandOrange }} />
        </button>
      </div>

      {showInfo && (
        <div className={`${theme.itemBg} border ${theme.mainCardBorder} rounded-lg p-3`}>
          <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
            Checking a policy will <strong>hide it from users</strong> and means your application{' '}
            <strong>won't support configuration or usage</strong> of that policy.
          </p>
        </div>
      )}

      <div className={`${theme.itemBg} border ${theme.mainCardBorder} rounded-lg p-4`}>
        {policies.length === 0 ? (
          <div className={`text-sm ${theme.textMuted}`} style={fonts.body}>
            No policies available
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-3">
            {policies.map((policy) => (
              <div
                key={policy.packageName}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${theme.mainCardBorder} ${theme.mainCard} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
              >
                <Checkbox
                  id={`${name}-${policy.packageName}`}
                  checked={currentValues.includes(policy.packageName)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(policy.packageName, checked as boolean)
                  }
                  className="mt-0.5"
                />
                <div className="grid gap-1.5 leading-none flex-1">
                  <label
                    htmlFor={`${name}-${policy.packageName}`}
                    className={`text-sm font-medium leading-none cursor-pointer ${theme.text}`}
                    style={fonts.heading}
                  >
                    {policy.title}
                  </label>
                  <div className="flex items-center gap-2">
                    <p className={`text-xs ${theme.textMuted} font-mono`} style={fonts.body}>
                      {policy.packageName}
                    </p>
                    {'specificVersion' in policy && policy.specificVersion && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: theme.brandOrange, color: 'white' }}
                      >
                        v{policy.specificVersion}
                      </span>
                    )}
                    <a
                      href={`https://www.npmjs.com/package/${policy.packageName}${
                        'specificVersion' in policy && policy.specificVersion
                          ? `/v/${policy.specificVersion}`
                          : ''
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-75 transition-opacity"
                      title={`View ${policy.packageName} on npm`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        <img src="/npm.png" alt="npm" className="w-full h-full object-contain" />
                      </div>
                    </a>
                  </div>
                  {policy.description && (
                    <p className={`text-xs ${theme.textMuted} mt-1`} style={fonts.body}>
                      {policy.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {currentValues.length > 0 && (
        <div className={`text-sm ${theme.textMuted}`} style={fonts.body}>
          {currentValues.length} of {policies.length}{' '}
          {currentValues.length === 1 ? 'policy' : 'policies'} hidden
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400" style={fonts.body}>
          {error}
        </p>
      )}
    </div>
  );
}
