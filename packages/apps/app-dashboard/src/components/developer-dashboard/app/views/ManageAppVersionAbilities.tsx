import { useState } from 'react';
import { Edit, X, Package } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import {
  EditAppVersionAbilityButton,
  DeleteAppVersionAbilityButton,
  UndeleteAppVersionAbilityButton,
} from '../wrappers';
import { AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

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
      <div className="text-center py-8">
        <Package className={`w-8 h-8 ${theme.textMuted} mx-auto mb-2`} />
        <p className={`${theme.textMuted}`} style={fonts.body}>
          No abilities assigned to this app version yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Abilities Section */}
      {abilities.length === 0 ? (
        <div className="text-center py-8">
          <Package className={`w-8 h-8 ${theme.textMuted} mx-auto mb-2`} />
          <p className={`${theme.textMuted}`} style={fonts.body}>
            No active abilities assigned to this app version yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {abilities.map((ability) => (
            <div
              key={ability.abilityPackageName}
              className={`${theme.itemBg} border ${theme.mainCardBorder} rounded-lg p-4`}
            >
              {editingAbility === ability.abilityPackageName ? (
                // Edit mode - render wrapper
                <div className="space-y-4">
                  <div
                    className={`flex justify-between items-center border-b ${theme.cardBorder} pb-3`}
                  >
                    <h4 className={`font-medium ${theme.text}`} style={fonts.heading}>
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold ${theme.text} truncate`} style={fonts.heading}>
                      {ability.abilityPackageName}
                    </h4>
                    <p className={`text-sm ${theme.textMuted} mt-1`} style={fonts.body}>
                      Version: {ability.abilityVersion}
                    </p>
                    {ability.hiddenSupportedPolicies &&
                      ability.hiddenSupportedPolicies.length > 0 && (
                        <p className={`text-sm ${theme.textMuted} mt-1`} style={fonts.body}>
                          Hidden policies: {ability.hiddenSupportedPolicies.join(', ')}
                        </p>
                      )}
                    <p className={`text-xs ${theme.textSubtle} mt-2`} style={fonts.body}>
                      Added: {new Date(ability.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAbility(ability.abilityPackageName)}
                      className="h-8 px-3"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <DeleteAppVersionAbilityButton
                      appId={appId}
                      versionId={versionId}
                      ability={ability}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Deleted Abilities Section */}
      {deletedAbilities && deletedAbilities.length > 0 && (
        <div className="space-y-3">
          <div className={`border-t ${theme.cardBorder} pt-6`}>
            <h3
              className={`text-sm font-semibold ${theme.textMuted} mb-4 uppercase tracking-wider`}
              style={fonts.heading}
            >
              Deleted Abilities
            </h3>
            <div className="space-y-3">
              {deletedAbilities.map((ability) => (
                <div
                  key={ability.abilityPackageName}
                  className={`${theme.itemBg} border border-dashed ${theme.mainCardBorder} rounded-lg p-4 opacity-60`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={`font-semibold ${theme.textMuted} line-through truncate`}
                          style={fonts.heading}
                        >
                          {ability.abilityPackageName}
                        </h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex-shrink-0">
                          DELETED
                        </span>
                      </div>
                      <p
                        className={`text-sm ${theme.textMuted} line-through mt-1`}
                        style={fonts.body}
                      >
                        Version: {ability.abilityVersion}
                      </p>
                      {ability.hiddenSupportedPolicies &&
                        ability.hiddenSupportedPolicies.length > 0 && (
                          <p
                            className={`text-sm ${theme.textMuted} mt-1 line-through`}
                            style={fonts.body}
                          >
                            Hidden policies: {ability.hiddenSupportedPolicies.join(', ')}
                          </p>
                        )}
                      <p className={`text-xs ${theme.textSubtle} mt-2`} style={fonts.body}>
                        Added: {new Date(ability.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <UndeleteAppVersionAbilityButton appVersionAbility={ability} />
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
