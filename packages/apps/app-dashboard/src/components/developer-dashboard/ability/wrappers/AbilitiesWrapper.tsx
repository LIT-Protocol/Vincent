import { useUserAbilities } from '@/hooks/developer-dashboard/ability/useUserAbilities';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AbilitiesListView } from '../views/AbilitiesListView';

export function AbilitiesWrapper() {
  const {
    data: abilities,
    deletedAbilities,
    isLoading: abilitiesLoading,
    isError: abilitiesError,
  } = useUserAbilities();

  // Loading states first
  if (abilitiesLoading) return <Loading />;

  // Combined error states
  if (abilitiesError) return <StatusMessage message="Failed to load abilities" type="error" />;

  return <AbilitiesListView abilities={abilities} deletedAbilities={deletedAbilities} />;
}
