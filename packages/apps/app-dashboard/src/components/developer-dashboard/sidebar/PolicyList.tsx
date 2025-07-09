import { FileText, GitBranch } from 'lucide-react';
import { useMemo } from 'react';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Policy, PolicyVersion } from '@/types/developer-dashboard/appTypes';

interface PolicyListProps {
  policies: Policy[];
  selectedPolicy: Policy | null;
  selectedPolicyView: string | null;
  expandedMenus: Set<string>;
  onPolicySelection: (policy: Policy) => void;
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
    {
      packageName: selectedPolicy?.packageName || '',
    },
    { skip: !selectedPolicy?.packageName },
  ); // FIXME: Sidebar-related patch, we don't want to fetch versions if no policy is selected

  const sortedVersions = useMemo(() => {
    if (!policyVersions || policyVersions.length === 0) return [];
    // Filter out deleted versions from sidebar dropdown
    const activeVersions = policyVersions.filter((version: PolicyVersion) => !version.isDeleted);
    return [...activeVersions].sort((a: PolicyVersion, b: PolicyVersion) =>
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
            ? sortedVersions.map((version: PolicyVersion) => ({
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
      {policies.map((policy: Policy) => (
        <div key={policy.packageName}>
          <button
            onClick={() => onPolicySelection(policy)}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all duration-200 ease-in-out focus:outline-none ${
              selectedPolicy?.packageName === policy.packageName
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
            aria-label={`Select policy ${policy.title}`}
            aria-pressed={selectedPolicy?.packageName === policy.packageName}
          >
            <div className="truncate">
              <div className="font-medium">{policy.title}</div>
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
                        className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors focus:outline-none ${
                          hasVersionsError
                            ? 'text-gray-400 cursor-not-allowed'
                            : selectedPolicyView === policyItem.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
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
                                className={`w-full text-left px-4 py-2 text-xs rounded-lg transition-all duration-200 ease-in-out focus:outline-none ${
                                  subMenuItem.disabled
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : selectedPolicyView === subMenuItem.id
                                      ? 'bg-blue-50 text-blue-700 font-medium'
                                      : 'text-gray-600 hover:bg-gray-50'
                                }`}
                                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
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
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-all duration-200 ease-in-out text-sm focus:outline-none ${
                      selectedPolicyView === policyItem.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
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
