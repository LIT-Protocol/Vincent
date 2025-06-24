import { FileText, GitBranch } from 'lucide-react';
import { useMemo } from 'react';
import { vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

interface PolicyListProps {
  policies: any[]; // FIXME: When we export the types for the policies, we can use them here
  selectedPolicy: any | null;
  selectedPolicyView: string | null;
  expandedMenus: Set<string>;
  onPolicySelection: (policy: any) => void;
  onPolicyViewSelection: (viewId: string) => void;
  onToggleMenu: (menuId: string) => void;
}

export function PolicyList({
  policies,
  selectedPolicy,
  selectedPolicyView,
  expandedMenus,
  onPolicySelection,
  onPolicyViewSelection,
  onToggleMenu,
}: PolicyListProps) {
  const {
    data: policyVersions,
    isLoading: versionsLoading,
    error: versionsError,
  } = vincentApiClient.useGetPolicyVersionsQuery(
    { packageName: selectedPolicy?.packageName },
    { skip: !selectedPolicy?.packageName || typeof selectedPolicy.packageName !== 'string' },
  );

  const sortedVersions = useMemo(() => {
    if (!policyVersions || policyVersions.length === 0) return [];
    return [...policyVersions].sort((a: any, b: any) =>
      b.version.localeCompare(a.version, undefined, { numeric: true }),
    );
  }, [policyVersions]);

  const policyMenuItems = useMemo(() => {
    if (!selectedPolicy) return [];

    return [
      { id: 'policy-details', label: 'Policy Details', icon: FileText },
      {
        id: 'policy-versions',
        label: 'Policy Versions',
        icon: GitBranch,
        submenu:
          sortedVersions.length > 0
            ? sortedVersions.map((version: any) => ({
                id: `version-${version.version}`,
                label: `Version ${version.version}${version.version === selectedPolicy.activeVersion ? ' (Active)' : ''}`,
              }))
            : [{ id: 'no-versions', label: 'No versions available', disabled: true }],
      },
    ];
  }, [selectedPolicy, sortedVersions]);

  const handlePolicyViewNavigation = (viewId: string) => {
    onPolicyViewSelection(viewId);
    if (viewId === 'policy-versions' && !expandedMenus.has('policy-versions')) {
      onToggleMenu('policy-versions');
    }
  };

  const handlePolicySubmenuNavigation = (submenuId: string) => {
    if (submenuId.startsWith('version-')) {
      const versionNumber = submenuId.replace('version-', '');
      onPolicyViewSelection(`version-${versionNumber}`);
    } else {
      onPolicyViewSelection(submenuId);
    }
  };

  if (!policies || policies.length === 0) {
    return <div className="ml-4 mt-1 px-3 py-2 text-xs text-gray-400">No policies found</div>;
  }

  return (
    <div className="ml-4 mt-1 space-y-1">
      {policies.map((policy: any) => (
        <div key={policy.packageName}>
          <button
            onClick={() => onPolicySelection(policy)}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all duration-200 ease-in-out ${
              selectedPolicy?.packageName === policy.packageName
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            aria-label={`Select policy ${policy.policyTitle}`}
            aria-pressed={selectedPolicy?.packageName === policy.packageName}
          >
            <div className="truncate">
              <div className="font-medium">{policy.policyTitle}</div>
              <div className="text-xs opacity-75">{policy.packageName}</div>
            </div>
          </button>

          {selectedPolicy?.packageName === policy.packageName && (
            <div className="ml-4 mt-2 space-y-1" role="group" aria-label="Policy actions">
              {/* Show menu items - always show basic items, handle versions separately */}
              {policyMenuItems.map((policyItem) => {
                const PolicyIcon = policyItem.icon;

                if (policyItem.submenu) {
                  const isPolicySubmenuExpanded = expandedMenus.has(policyItem.id);
                  const isVersionsMenu = policyItem.id === 'policy-versions';
                  const hasVersionsError = isVersionsMenu && !!versionsError;
                  const isVersionsLoading = isVersionsMenu && versionsLoading;

                  return (
                    <div key={policyItem.id}>
                      <button
                        onClick={() => handlePolicyViewNavigation(policyItem.id)}
                        disabled={hasVersionsError}
                        className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                          hasVersionsError
                            ? 'text-gray-400 cursor-not-allowed'
                            : selectedPolicyView === policyItem.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        aria-label={policyItem.label}
                        aria-expanded={isPolicySubmenuExpanded}
                        aria-controls={`submenu-${policyItem.id}`}
                      >
                        <PolicyIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="ml-2">{policyItem.label}</span>
                      </button>
                      {isPolicySubmenuExpanded && (
                        <div
                          className="ml-6 mt-1 space-y-1"
                          id={`submenu-${policyItem.id}`}
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
                          {policyItem.submenu.map((subMenuItem: any) => {
                            // Don't show version items if loading/error for policy-versions
                            if (isVersionsMenu && (isVersionsLoading || hasVersionsError)) {
                              return <></>;
                            }

                            return (
                              <button
                                key={subMenuItem.id}
                                onClick={() => handlePolicySubmenuNavigation(subMenuItem.id)}
                                disabled={subMenuItem.disabled}
                                className={`w-full text-left px-4 py-2 text-xs rounded-lg transition-all duration-200 ease-in-out ${
                                  subMenuItem.disabled
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : selectedPolicyView === subMenuItem.id
                                      ? 'bg-blue-50 text-blue-700 font-medium'
                                      : 'text-gray-600 hover:bg-gray-50'
                                }`}
                                aria-label={subMenuItem.label}
                                aria-pressed={
                                  !subMenuItem.disabled && selectedPolicyView === subMenuItem.id
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
                    key={policyItem.id}
                    onClick={() => handlePolicyViewNavigation(policyItem.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-all duration-200 ease-in-out text-sm ${
                      selectedPolicyView === policyItem.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    aria-label={policyItem.label}
                    aria-pressed={selectedPolicyView === policyItem.id}
                  >
                    <PolicyIcon className="h-3 w-3 flex-shrink-0" />
                    <span className="ml-2">{policyItem.label}</span>
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
