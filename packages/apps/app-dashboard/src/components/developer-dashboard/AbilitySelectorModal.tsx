import { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  ICellRendererParams,
  ModuleRegistry,
  AllCommunityModule,
  RowClickedEvent,
} from 'ag-grid-community';
import { CheckCircle2, X } from 'lucide-react';

import { Ability } from '@/types/developer-dashboard/appTypes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { AbilityVersionSelectorModal } from './AbilityVersionSelectorModal';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface SelectedAbilityWithVersion {
  ability: Ability;
  version: string;
}

// Dynamic column definitions based on selected abilities
const createToolGridColumns = (
  selectedAbilities: Map<string, SelectedAbilityWithVersion>,
): ColDef[] => [
  {
    headerName: '',
    field: 'packageName',
    width: 50,
    maxWidth: 50,
    minWidth: 50,
    suppressNavigable: true,
    cellRenderer: (params: ICellRendererParams) => {
      const isSelected = selectedAbilities.has(params.value);
      return (
        <div className="flex items-center justify-center h-full">
          {isSelected && <CheckCircle2 className="w-5 h-5" style={{ color: theme.brandOrange }} />}
        </div>
      );
    },
  },
  {
    headerName: 'Ability Name',
    field: 'title',
    flex: 2,
    minWidth: 200,
    cellRenderer: (params: ICellRendererParams) => {
      const isSelected = selectedAbilities.has(params.data.packageName);
      return (
        <div className="flex items-center justify-between h-full">
          <div>
            <div className={`font-medium ${isSelected ? 'font-semibold' : ''}`}>
              {params.value || params.data.packageName}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    headerName: 'Package Name',
    field: 'packageName',
    flex: 2,
    minWidth: 180,
    suppressNavigable: true,
    cellRenderer: (params: ICellRendererParams) => {
      return (
        <div className="flex items-center h-full">
          <span
            ref={(ref) => {
              if (!ref) return;

              ref.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();

                const packageName = params.value;
                const version = params.data.activeVersion;
                const npmUrl = `https://www.npmjs.com/package/${packageName}/v/${version}`;
                window.open(npmUrl, '_blank');
              };
            }}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:underline text-sm font-mono cursor-pointer"
            title={`View ${params.value} on npm`}
          >
            {params.value}
          </span>
        </div>
      );
    },
  },
  {
    headerName: 'Version',
    field: 'activeVersion',
    flex: 1,
    minWidth: 120,
    cellRenderer: (params: ICellRendererParams) => {
      const selected = selectedAbilities.get(params.data.packageName);
      const displayVersion = selected ? selected.version : params.value;
      const isSelected = !!selected;
      return (
        <div className="flex items-center h-full">
          <span className={isSelected ? 'font-semibold' : ''}>
            {displayVersion}
            {isSelected && (
              <span className="ml-2 text-xs" style={{ color: theme.brandOrange }}>
                (selected)
              </span>
            )}
          </span>
        </div>
      );
    },
  },
  {
    headerName: 'Description',
    field: 'description',
    width: 600,
    minWidth: 400,
    maxWidth: 1000,
    cellRenderer: (params: ICellRendererParams) => {
      return (
        <div className="flex items-center h-full">
          <div className="text-sm text-gray-600 dark:text-gray-300" title={params.value}>
            {params.value || 'No description available'}
          </div>
        </div>
      );
    },
  },
];

const DEFAULT_COL_DEF = {
  sortable: true,
  filter: true,
  resizable: true,
  suppressSizeToFit: false,
};

interface AbilitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAbilityAdd: (ability: Ability) => Promise<void>;
  existingAbilities: string[];
  availableAbilities: Ability[];
}

export function AbilitySelectorModal({
  isOpen,
  onClose,
  onAbilityAdd,
  existingAbilities,
  availableAbilities,
}: AbilitySelectorModalProps) {
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [isVersionSelectorOpen, setIsVersionSelectorOpen] = useState(false);
  const [selectedAbilities, setSelectedAbilities] = useState<
    Map<string, SelectedAbilityWithVersion>
  >(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out already added abilities and deleted abilities
  const filteredAbilities = availableAbilities.filter(
    (ability) => !existingAbilities.includes(ability.packageName) && !ability.isDeleted,
  );

  const handleRowClick = async (event: RowClickedEvent) => {
    const ability = event.data;
    if (!ability) {
      return;
    }

    // If already selected, deselect it
    if (selectedAbilities.has(ability.packageName)) {
      handleRemoveSelection(ability.packageName);
      return;
    }

    // Open version selector modal to select
    setSelectedAbility(ability);
    setIsVersionSelectorOpen(true);
  };

  const handleVersionSelect = async (version: string) => {
    if (!selectedAbility) return;

    // Add to selected abilities map
    setSelectedAbilities((prev) => {
      const newMap = new Map(prev);
      newMap.set(selectedAbility.packageName, {
        ability: selectedAbility,
        version: version,
      });
      return newMap;
    });

    // Close version selector modal but keep ability selector open
    setIsVersionSelectorOpen(false);
    setSelectedAbility(null);
  };

  const handleRemoveSelection = (packageName: string) => {
    setSelectedAbilities((prev) => {
      const newMap = new Map(prev);
      newMap.delete(packageName);
      return newMap;
    });
  };

  const handleAddAbilities = async () => {
    if (selectedAbilities.size === 0) return;

    setIsSubmitting(true);
    try {
      // Add all selected abilities in parallel
      await Promise.all(
        Array.from(selectedAbilities.values()).map(({ ability, version }) => {
          const abilityWithVersion = {
            ...ability,
            activeVersion: version,
          };
          return onAbilityAdd(abilityWithVersion);
        }),
      );

      // Clear selections but keep modal open for more selections
      setSelectedAbilities(new Map());
    } catch (error) {
      console.error('Failed to add abilities:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVersionSelectorClose = () => {
    setIsVersionSelectorOpen(false);
    setSelectedAbility(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedAbilities(new Map());
      onClose();
    }
  };

  const getRowClass = (params: any) => {
    const isSelected = selectedAbilities.has(params.data?.packageName);
    return `cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700 ${isSelected ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`w-[85vw] max-w-6xl h-[70vh] flex flex-col !max-w-none ${theme.mainCard}`}
        style={{ width: '85vw', maxWidth: '72rem' }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className={`text-lg font-semibold ${theme.text}`} style={fonts.heading}>
            Add Abilities to App Version
          </DialogTitle>
          <DialogDescription className={`${theme.textMuted}`} style={fonts.body}>
            Click any ability to select a version. Click again to deselect. You can select multiple
            abilities before adding them.
          </DialogDescription>
        </DialogHeader>

        <div className={`flex-1 min-h-0 border ${theme.mainCardBorder} rounded-lg overflow-hidden`}>
          <div
            className="ag-theme-alpine h-full w-full"
            style={
              {
                '--ag-background-color': 'transparent',
                '--ag-header-background-color': theme.itemBg,
                '--ag-odd-row-background-color': theme.mainCard,
                '--ag-row-hover-color': theme.itemBg,
                '--ag-border-color': theme.mainCardBorder,
                '--ag-header-foreground-color': theme.text,
                '--ag-foreground-color': theme.text,
                '--ag-data-color': theme.text,
              } as React.CSSProperties
            }
          >
            <AgGridReact
              rowData={filteredAbilities}
              columnDefs={createToolGridColumns(selectedAbilities)}
              defaultColDef={DEFAULT_COL_DEF}
              onRowClicked={handleRowClick}
              getRowClass={getRowClass}
              rowHeight={50}
              suppressHorizontalScroll={false}
              alwaysShowHorizontalScroll={true}
              suppressScrollOnNewData={true}
              domLayout="normal"
            />
          </div>
        </div>

        {/* Selected Abilities List */}
        {selectedAbilities.size > 0 && (
          <div className={`flex-shrink-0 border ${theme.mainCardBorder} rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className={`text-sm font-semibold ${theme.text}`} style={fonts.heading}>
                Selected Abilities ({selectedAbilities.size})
              </h4>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Array.from(selectedAbilities.values()).map(({ ability, version }) => (
                <div
                  key={ability.packageName}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg ${theme.itemBg}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${theme.text} truncate`}>
                        {ability.title || ability.packageName}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: theme.brandOrange, color: 'white' }}
                      >
                        v{version}
                      </span>
                    </div>
                    <div className={`text-xs ${theme.textMuted} font-mono truncate`}>
                      {ability.packageName}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveSelection(ability.packageName)}
                    className={`ml-2 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30`}
                    title="Remove from selection"
                  >
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className={`flex justify-between items-center gap-2 pt-4 border-t ${theme.cardBorder} flex-shrink-0`}
        >
          <div className={`text-sm ${theme.textMuted}`}>
            {selectedAbilities.size > 0 ? (
              <span>
                {selectedAbilities.size} {selectedAbilities.size === 1 ? 'ability' : 'abilities'}{' '}
                selected
              </span>
            ) : (
              <span>Select abilities to add to your app version</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAddAbilities}
              disabled={selectedAbilities.size === 0 || isSubmitting}
              style={{ backgroundColor: theme.brandOrange, ...fonts.body }}
            >
              {isSubmitting
                ? 'Adding Abilities...'
                : `Add ${selectedAbilities.size > 0 ? selectedAbilities.size : ''} ${selectedAbilities.size === 1 ? 'Ability' : 'Abilities'}`}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Version Selector Modal */}
      <AbilityVersionSelectorModal
        isOpen={isVersionSelectorOpen}
        onClose={handleVersionSelectorClose}
        onVersionSelect={handleVersionSelect}
        ability={selectedAbility}
      />
    </Dialog>
  );
}
