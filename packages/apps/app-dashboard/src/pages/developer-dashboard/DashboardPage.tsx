import { useNavigate } from 'react-router';
import { DashboardContent } from '@/components/developer-dashboard/DashboardContent';
import { MenuId } from '@/types/developer-dashboard/menuId';
import { App, Policy, Ability } from '@/types/developer-dashboard/appTypes';

interface DashboardPageProps {
  apps: App[];
  abilities: Ability[];
  policies: Policy[];
}

export default function DashboardPage({ apps, abilities, policies }: DashboardPageProps) {
  const navigate = useNavigate();

  const handleMenuSelection = (id: MenuId) => {
    const routes: Record<MenuId, string> = {
      'create-app': '/developer/create-app',
      'create-ability': '/developer/create-ability',
      'create-policy': '/developer/create-policy',
      app: '/developer/apps',
      ability: '/developer/abilities',
      policy: '/developer/policies',
    };

    const route = routes[id];
    if (route) {
      navigate(route);
    } else {
      // This should never happen with proper typing
      console.warn('Unknown menu selection:', id);
    }
  };

  return (
    <DashboardContent
      filteredAppsCount={apps.length}
      filteredAbilitiesCount={abilities.length}
      filteredPoliciesCount={policies.length}
      onMenuSelection={handleMenuSelection}
    />
  );
}
