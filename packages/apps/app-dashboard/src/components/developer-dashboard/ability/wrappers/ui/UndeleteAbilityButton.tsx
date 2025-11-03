import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';
import { Ability } from '@/types/developer-dashboard/appTypes';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

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
      navigate(`/developer/abilities/ability/${encodeURIComponent(ability.packageName)}`);
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
