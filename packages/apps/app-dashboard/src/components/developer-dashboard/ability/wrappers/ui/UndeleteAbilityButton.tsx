import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';
import { ArchiveRestore } from 'lucide-react';
import { Ability } from '@/types/developer-dashboard/appTypes';

interface UndeleteAbilityWrapperProps {
  ability: Ability;
}

export function UndeleteAbilityButton({ ability }: UndeleteAbilityWrapperProps) {
  // Mutation
  const [undeleteAbility, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useUndeleteAbilityMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && ability) {
      navigate(`/developer/ability/${encodeURIComponent(ability.packageName)}`);
    }
  }, [isSuccess, data, ability]);

  // Loading states
  if (isLoading) return <Loading />;

  // Error states
  if (!ability) return <StatusMessage message={`Ability not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Undeleting ability..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Ability undeleted successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to undelete ability');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    await undeleteAbility({
      packageName: ability.packageName,
    });
  };

  return (
    <button
      onClick={() => handleSubmit()}
      className="inline-flex items-center gap-2 px-4 py-2 border border-green-200 rounded-lg text-sm font-medium text-green-600 bg-white hover:bg-green-50 transition-colors relative z-10 !opacity-100 shadow-sm"
    >
      <ArchiveRestore className="h-4 w-4" />
      Undelete Ability
    </button>
  );
}
