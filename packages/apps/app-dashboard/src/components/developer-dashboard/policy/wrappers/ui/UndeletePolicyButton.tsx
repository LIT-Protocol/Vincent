import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';
import { ArchiveRestore } from 'lucide-react';
import { Policy } from '@/types/developer-dashboard/appTypes';

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
      navigate(`/developer/policy/${encodeURIComponent(policy.packageName)}`);
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
      onClick={() => handleSubmit()}
      className="inline-flex items-center gap-2 px-4 py-2 border border-green-200 rounded-lg text-sm font-medium text-green-600 bg-white hover:bg-green-50 transition-colors relative z-10 !opacity-100 shadow-sm"
    >
      <ArchiveRestore className="h-4 w-4" />
      Undelete Policy
    </button>
  );
}
