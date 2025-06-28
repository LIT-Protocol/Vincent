import { FileText, GitBranch } from 'lucide-react';
import { useMemo } from 'react';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

interface ToolListProps {
  tools: any[]; // FIXME: When we export the types for the tools, we can use them here
  selectedTool: any | null;
  selectedToolView: string | null;
  expandedMenus: Set<string>;
  onToolSelection: (tool: any) => void;
  onToolViewSelection: (viewId: string) => void;
  onToggleMenu: (menuId: string) => void;
}

export function ToolList({
  tools,
  selectedTool,
  selectedToolView,
  expandedMenus,
  onToolSelection,
  onToolViewSelection,
  onToggleMenu,
}: ToolListProps) {
  const {
    data: toolVersions,
    isLoading: versionsLoading,
    error: versionsError,
  } = vincentApiClient.useGetToolVersionsQuery(
    { packageName: selectedTool?.packageName },
    { skip: !selectedTool?.packageName || typeof selectedTool.packageName !== 'string' },
  );

  const sortedVersions = useMemo(() => {
    if (!toolVersions || toolVersions.length === 0) return [];
    return [...toolVersions].sort((a: any, b: any) =>
      b.version.localeCompare(a.version, undefined, { numeric: true }),
    );
  }, [toolVersions]);

  const toolMenuItems = useMemo(() => {
    if (!selectedTool) return [];

    return [
      { id: 'tool-details', label: 'Tool Details', icon: FileText },
      {
        id: 'tool-versions',
        label: 'Tool Versions',
        icon: GitBranch,
        submenu:
          sortedVersions.length > 0
            ? sortedVersions.map((version: any) => ({
                id: `version-${version.version}`,
                label: `Version ${version.version}${version.version === selectedTool.activeVersion ? ' (Active)' : ''}`,
              }))
            : [{ id: 'no-versions', label: 'No versions available', disabled: true }],
      },
    ];
  }, [selectedTool, sortedVersions]);

  const handleToolViewNavigation = (viewId: string) => {
    onToolViewSelection(viewId);
    if (viewId === 'tool-versions' && !expandedMenus.has('tool-versions')) {
      onToggleMenu('tool-versions');
    }
  };

  const handleToolSubmenuNavigation = (submenuId: string) => {
    if (submenuId.startsWith('version-')) {
      const versionNumber = submenuId.replace('version-', '');
      onToolViewSelection(`version-${versionNumber}`);
    } else {
      onToolViewSelection(submenuId);
    }
  };

  if (!tools || tools.length === 0) {
    return <div className="ml-4 mt-1 px-3 py-2 text-xs text-gray-400">No tools found</div>;
  }

  return (
    <div className="ml-4 mt-1 space-y-1">
      {tools.map((tool: any) => (
        <div key={tool.packageName}>
          <button
            onClick={() => onToolSelection(tool)}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all duration-200 ease-in-out focus:outline-none ${
              selectedTool?.packageName === tool.packageName
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
            aria-label={`Select tool ${tool.toolTitle}`}
            aria-pressed={selectedTool?.packageName === tool.packageName}
          >
            <div className="truncate">
              <div className="font-medium">{tool.toolTitle}</div>
              <div className="text-xs opacity-75">{tool.packageName}</div>
            </div>
          </button>

          {selectedTool?.packageName === tool.packageName && (
            <div className="ml-4 mt-2 space-y-1" role="group" aria-label="Tool actions">
              {/* Show menu items - always show basic items, handle versions separately */}
              {toolMenuItems.map((toolItem) => {
                const ToolIcon = toolItem.icon;

                if (toolItem.submenu) {
                  const isToolSubmenuExpanded = expandedMenus.has(toolItem.id);
                  const isVersionsMenu = toolItem.id === 'tool-versions';
                  const hasVersionsError = isVersionsMenu && !!versionsError;
                  const isVersionsLoading = isVersionsMenu && versionsLoading;

                  return (
                    <div key={toolItem.id}>
                      <button
                        onClick={() => handleToolViewNavigation(toolItem.id)}
                        disabled={hasVersionsError}
                        className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors focus:outline-none ${
                          hasVersionsError
                            ? 'text-gray-400 cursor-not-allowed'
                            : selectedToolView === toolItem.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                        aria-label={toolItem.label}
                        aria-expanded={isToolSubmenuExpanded}
                        aria-controls={`submenu-${toolItem.id}`}
                      >
                        <ToolIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="ml-2">{toolItem.label}</span>
                      </button>
                      {isToolSubmenuExpanded && (
                        <div
                          className="ml-6 mt-1 space-y-1"
                          id={`submenu-${toolItem.id}`}
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
                          {toolItem.submenu.map((subMenuItem: any) => {
                            // Don't show version items if loading/error for tool-versions
                            if (isVersionsMenu && (isVersionsLoading || hasVersionsError)) {
                              return <></>;
                            }

                            return (
                              <button
                                key={subMenuItem.id}
                                onClick={() => handleToolSubmenuNavigation(subMenuItem.id)}
                                disabled={subMenuItem.disabled}
                                className={`w-full text-left px-4 py-2 text-xs rounded-lg transition-all duration-200 ease-in-out focus:outline-none ${
                                  subMenuItem.disabled
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : selectedToolView === subMenuItem.id
                                      ? 'bg-blue-50 text-blue-700 font-medium'
                                      : 'text-gray-600 hover:bg-gray-50'
                                }`}
                                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                                aria-label={subMenuItem.label}
                                aria-pressed={
                                  !subMenuItem.disabled && selectedToolView === subMenuItem.id
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
                    key={toolItem.id}
                    onClick={() => handleToolViewNavigation(toolItem.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-all duration-200 ease-in-out text-sm focus:outline-none ${
                      selectedToolView === toolItem.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    aria-label={toolItem.label}
                    aria-pressed={selectedToolView === toolItem.id}
                  >
                    <ToolIcon className="h-3 w-3 flex-shrink-0" />
                    <span className="ml-2">{toolItem.label}</span>
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
