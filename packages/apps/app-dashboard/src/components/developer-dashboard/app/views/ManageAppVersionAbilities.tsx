import { Button } from '@/components/shared/ui/button';
import { Edit, X } from 'lucide-react';
import {
  EditAppVersionAbilityButton,
  DeleteAppVersionAbilityButton,
  UndeleteAppVersionAbilityButton,
} from '../wrappers';
import { AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { useState } from 'react';

interface ManageAppVersionAbilitiesProps {
  abilities: AppVersionAbility[];
  deletedAbilities: AppVersionAbility[];
  appId: number;
  versionId: number;
}

export function ManageAppVersionAbilities({
  abilities,
  deletedAbilities,
  appId,
  versionId,
}: ManageAppVersionAbilitiesProps) {
  const [editingAbility, setEditingAbility] = useState<string | null>(null);

  const handleEditAbility = (abilityPackageName: string) => {
    setEditingAbility(abilityPackageName);
  };

  const handleCancelEdit = () => {
    setEditingAbility(null);
  };

  const handleEditSuccess = () => {
    setEditingAbility(null);
  };

  if (abilities.length === 0 && (!deletedAbilities || deletedAbilities.length === 0)) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No abilities assigned to this app version yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Abilities Section */}
      {abilities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No active abilities assigned to this app version yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {abilities.map((ability) => (
              <div key={ability.abilityPackageName} className="bg-white border rounded-lg p-4">
                {editingAbility === ability.abilityPackageName ? (
                  // Edit mode - render wrapper
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <h4 className="font-medium text-gray-900">
                        Edit {ability.abilityPackageName}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <EditAppVersionAbilityButton
                      appId={appId}
                      versionId={versionId}
                      ability={ability}
                      onSuccess={handleEditSuccess}
                      onCancel={handleCancelEdit}
                    />
                  </div>
                ) : (
                  // Normal display mode
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{ability.abilityPackageName}</h4>
                      <p className="text-sm text-gray-500">Version: {ability.abilityVersion}</p>
                      {ability.hiddenSupportedPolicies &&
                        ability.hiddenSupportedPolicies.length > 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            Hidden policies: {ability.hiddenSupportedPolicies.join(', ')}
                          </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-400">
                        Added: {new Date(ability.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAbility(ability.abilityPackageName)}
                          className="h-8 px-2"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <DeleteAppVersionAbilityButton
                          appId={appId}
                          versionId={versionId}
                          ability={ability}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deleted Abilities Section */}
      {deletedAbilities && deletedAbilities.length > 0 && (
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-600 mb-4">Deleted Abilities</h3>
            <div className="grid gap-4">
              {deletedAbilities.map((ability) => (
                <div
                  key={ability.abilityPackageName}
                  className="bg-white border border-dashed rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-600 line-through">
                          {ability.abilityPackageName}
                        </h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-400">
                          DELETED
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 line-through">
                        Version: {ability.abilityVersion}
                      </p>
                      {ability.hiddenSupportedPolicies &&
                        ability.hiddenSupportedPolicies.length > 0 && (
                          <p className="text-sm text-gray-400 mt-1 line-through">
                            Hidden policies: {ability.hiddenSupportedPolicies.join(', ')}
                          </p>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-xs text-gray-400">
                        Added: {new Date(ability.createdAt).toLocaleDateString()}
                      </div>
                      <div className="relative z-10 bg-white rounded-lg opacity-100">
                        <UndeleteAppVersionAbilityButton appVersionAbility={ability} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
