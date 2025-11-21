import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { theme } from '@/components/user-dashboard/connect/ui/theme';

interface RefreshAbilityVersionPoliciesFormProps {
  onSubmit: () => Promise<void>;
  isSubmitting?: boolean;
  result?: {
    success: boolean;
    supportedPolicies?: Record<string, string>;
    error?: string;
  } | null;
}

export function RefreshAbilityVersionPoliciesForm({
  onSubmit,
  isSubmitting = false,
  result,
}: RefreshAbilityVersionPoliciesFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  const policyCount = result?.supportedPolicies ? Object.keys(result.supportedPolicies).length : 0;
  const policyNames = result?.supportedPolicies ? Object.keys(result.supportedPolicies) : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-gray-700 dark:text-gray-300">
        This will re-check the registry for any policy versions that may have been registered since
        this ability version was created.
      </p>

      {/* Success Message */}
      {result?.success && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Successfully refreshed policies
            </p>
            {policyCount > 0 ? (
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <p className="font-medium">
                  Found {policyCount} supported {policyCount === 1 ? 'policy' : 'policies'}:
                </p>
                <ul className="mt-1 list-disc list-inside">
                  {policyNames.map((policyName) => (
                    <li key={policyName}>{policyName}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                No new supported policies found
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {result?.success === false && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-600 dark:text-red-400">{result.error}</span>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        style={{ backgroundColor: theme.brandOrange }}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Refreshing...' : 'Refresh Policies'}
      </Button>
    </form>
  );
}
