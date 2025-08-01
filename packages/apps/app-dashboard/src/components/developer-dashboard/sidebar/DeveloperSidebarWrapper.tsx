import { Sidebar } from './Sidebar';
import { useDeveloperSidebarData } from '@/hooks/developer-dashboard/useDeveloperSidebarData';
import { DeveloperSidebarSkeleton } from './DeveloperSidebarSkeleton';
import { DeveloperSidebarError } from './DeveloperSidebarError';

export function DeveloperSidebarWrapper() {
  // Get base data only (apps, abilities, policies)
  const { userApps, userAbilities, userPolicies, isLoading, error } = useDeveloperSidebarData();

  // Handle loading state
  if (isLoading) {
    return <DeveloperSidebarSkeleton />;
  }

  // Handle errors
  if (error) {
    return <DeveloperSidebarError error={error} />;
  }

  return <Sidebar userApps={userApps} userAbilities={userAbilities} userPolicies={userPolicies} />;
}
