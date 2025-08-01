import { AppVersionAbility } from '@/types/developer-dashboard/appTypes';

interface AppVersionAbilitiesDisplayProps {
  abilities: AppVersionAbility[];
}

export function AppVersionAbilitiesDisplay({ abilities }: AppVersionAbilitiesDisplayProps) {
  if (abilities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-lg mb-2">📦</div>
        <p className="text-gray-600">No abilities assigned to this app version yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {abilities.map((ability: AppVersionAbility) => (
        <div key={ability.abilityPackageName} className="p-4 bg-gray-50 rounded-lg border">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-medium text-gray-900">{ability.abilityPackageName}</div>
              <div className="text-sm text-gray-600 mt-1">Version: {ability.abilityVersion}</div>
            </div>
            <div className="text-xs text-gray-400">
              Added: {new Date(ability.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
