import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';
import { Policy } from '@/types/developer-dashboard/appTypes';
import { theme, fonts } from '@/lib/themeClasses';

interface UndeletePolicyWrapperProps {
  policy: Policy;
}

export function UndeletePolicyButton({ policy }: UndeletePolicyWrapperProps) {
  // Mutation
  const [undeletePolicy, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useUndeletePolicyMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && policy) {
      navigate(`/developer/policies/policy/${encodeURIComponent(policy.packageName)}`);
    }
  }, [isSuccess, data, policy]);

  // Loading states
  if (isLoading) return <Loading />;

  // Error states
  if (!policy) return <StatusMessage message={`Policy not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Undeleting policy..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Policy undeleted successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to undelete policy');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    await undeletePolicy({
      packageName: policy.packageName,
    });
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleSubmit();
      }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${theme.itemBg} hover:bg-green-500/10 text-green-600 dark:text-green-400 border border-transparent hover:border-green-500/30`}
      style={fonts.body}
    >
      <RotateCcw className="h-3.5 w-3.5" />
      Restore
    </button>
  );
}
