import { FileText, GitBranch } from 'lucide-react';
import { useMemo } from 'react';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Ability, AbilityVersion } from '@/types/developer-dashboard/appTypes';

interface AbilityListProps {
  abilities: Ability[];
  selectedAbility: Ability | null;
  selectedAbilityView: string | null;
  expandedMenus: Set<string>;
  onAbilitySelection: (ability: Ability) => void;
  onAbilityViewSelection: (viewId: string) => void;
  onToggleMenu: (menuId: string) => void;
}

export function AbilityList({
  abilities,
  selectedAbility,
  selectedAbilityView,
  expandedMenus,
  onAbilitySelection,
  onAbilityViewSelection,
  onToggleMenu,
}: AbilityListProps) {
  const {
    data: abilityVersions,
    isLoading: versionsLoading,
    error: versionsError,
  } = vincentApiClient.useGetAbilityVersionsQuery(
    { packageName: selectedAbility?.packageName || '' },
    { skip: !selectedAbility?.packageName },
  ); // FIXME: Sidebar-related patch, we don't want to fetch versions if no ability is selected

  const sortedVersions = useMemo(() => {
    if (!abilityVersions || abilityVersions.length === 0) return [];
    // Filter out deleted versions from sidebar dropdown
    const activeVersions = abilityVersions.filter((version: AbilityVersion) => !version.isDeleted);
    return [...activeVersions].sort((a: AbilityVersion, b: AbilityVersion) =>
      b.version.localeCompare(a.version, undefined, { numeric: true }),
    );
  }, [abilityVersions]);

  const abilityMenuItems = useMemo(() => {
    if (!selectedAbility) return [];

    return [
      { id: 'ability-details', label: 'Ability Details', icon: FileText },
      {
        id: 'ability-versions',
        label: 'Ability Versions',
        icon: GitBranch,
        submenu:
          sortedVersions.length > 0
            ? sortedVersions.map((version: AbilityVersion) => ({
                id: `version-${version.version}`,
                label: `Version ${version.version}${version.version === selectedAbility.activeVersion ? ' (Active)' : ''}`,
              }))
            : [{ id: 'no-versions', label: 'No versions available', disabled: true }],
      },
    ];
  }, [selectedAbility, sortedVersions]);

  const handleAbilityViewNavigation = (viewId: string) => {
    onAbilityViewSelection(viewId);
    if (viewId === 'ability-versions' && !expandedMenus.has('ability-versions')) {
      onToggleMenu('ability-versions');
    }
  };

  const handleAbilitySubmenuNavigation = (submenuId: string) => {
    if (submenuId.startsWith('version-')) {
      const versionNumber = submenuId.replace('version-', '');
      onAbilityViewSelection(`version-${versionNumber}`);
    } else {
      onAbilityViewSelection(submenuId);
    }
  };

  if (!abilities || abilities.length === 0) {
    return <div className="ml-4 mt-1 px-3 py-2 text-xs text-gray-400">No abilities found</div>;
  }

  return (
    <div className="ml-4 mt-1 space-y-1">
      {abilities.map((ability: Ability) => (
        <div key={ability.packageName}>
          <button
            onClick={() => onAbilitySelection(ability)}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all duration-200 ease-in-out focus:outline-none ${
              selectedAbility?.packageName === ability.packageName
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
            aria-label={`Select ability ${ability.title}`}
            aria-pressed={selectedAbility?.packageName === ability.packageName}
          >
            <div className="truncate">
              <div className="font-medium">{ability.title}</div>
              <div className="text-xs opacity-75">{ability.packageName}</div>
            </div>
          </button>

          {selectedAbility?.packageName === ability.packageName && (
            <div className="ml-4 mt-2 space-y-1" role="group" aria-label="Ability actions">
              {/* Show menu items - always show basic items, handle versions separately */}
              {abilityMenuItems.map((abilityItem) => {
                const AbilityIcon = abilityItem.icon;

                if (abilityItem.submenu) {
                  const isAbilitySubmenuExpanded = expandedMenus.has(abilityItem.id);
                  const isVersionsMenu = abilityItem.id === 'ability-versions';
                  const hasVersionsError = isVersionsMenu && !!versionsError;
                  const isVersionsLoading = isVersionsMenu && versionsLoading;

                  return (
                    <div key={abilityItem.id}>
                      <button
                        onClick={() => handleAbilityViewNavigation(abilityItem.id)}
                        disabled={hasVersionsError}
                        className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors focus:outline-none ${
                          hasVersionsError
                            ? 'text-gray-400 cursor-not-allowed'
                            : selectedAbilityView === abilityItem.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                        aria-label={abilityItem.label}
                        aria-expanded={isAbilitySubmenuExpanded}
                        aria-controls={`submenu-${abilityItem.id}`}
                      >
                        <AbilityIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="ml-2">{abilityItem.label}</span>
                      </button>
                      {isAbilitySubmenuExpanded && (
                        <div
                          className="ml-6 mt-1 space-y-1"
                          id={`submenu-${abilityItem.id}`}
                          role="group"
                          aria-label="Version list"
                        >
                          {/* Show loading state for versions */}
                          {isVersionsLoading && (
                            <div className="px-4 py-2 text-xs text-gray-400">
                              Loading versions...
                            </div>
                          )}

                          {/* Show error state for versions */}
                          {hasVersionsError && (
                            <div className="px-4 py-2 text-xs text-red-500">
                              Error loading versions
                            </div>
                          )}

                          {/* Show version items when loaded or fallback */}
                          {abilityItem.submenu.map((subMenuItem: any) => {
                            // Don't show version items if loading/error for ability-versions
                            if (isVersionsMenu && (isVersionsLoading || hasVersionsError)) {
                              return <></>;
                            }

                            return (
                              <button
                                key={subMenuItem.id}
                                onClick={() => handleAbilitySubmenuNavigation(subMenuItem.id)}
                                disabled={subMenuItem.disabled}
                                className={`w-full text-left px-4 py-2 text-xs rounded-lg transition-all duration-200 ease-in-out focus:outline-none ${
                                  subMenuItem.disabled
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : selectedAbilityView === subMenuItem.id
                                      ? 'bg-blue-50 text-blue-700 font-medium'
                                      : 'text-gray-600 hover:bg-gray-50'
                                }`}
                                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                                aria-label={subMenuItem.label}
                                aria-pressed={
                                  !subMenuItem.disabled && selectedAbilityView === subMenuItem.id
                                }
                              >
                                {subMenuItem.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={abilityItem.id}
                    onClick={() => handleAbilityViewNavigation(abilityItem.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-all duration-200 ease-in-out text-sm focus:outline-none ${
                      selectedAbilityView === abilityItem.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    aria-label={abilityItem.label}
                    aria-pressed={selectedAbilityView === abilityItem.id}
                  >
                    <AbilityIcon className="h-3 w-3 flex-shrink-0" />
                    <span className="ml-2">{abilityItem.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
