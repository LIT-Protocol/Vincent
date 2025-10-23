import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  ICellRendererParams,
  ModuleRegistry,
  AllCommunityModule,
  RowClickedEvent,
} from 'ag-grid-community';

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

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Static column definitions
const TOOL_GRID_COLUMNS: ColDef[] = [
  {
    headerName: 'Ability Name',
    field: 'title',
    flex: 2,
    minWidth: 200,
    cellRenderer: (params: ICellRendererParams) => {
      return (
        <div className="flex items-center justify-between h-full">
          <div>
            <div className="font-medium">{params.value || params.data.packageName}</div>
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
    minWidth: 100,
    cellRenderer: (params: ICellRendererParams) => {
      return (
        <div className="flex items-center h-full">
          <span>{params.value}</span>
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
  // Filter out already added abilities
  const filteredAbilities = availableAbilities.filter(
    (ability) => !existingAbilities.includes(ability.packageName),
  );

  const handleRowClick = async (event: RowClickedEvent) => {
    const ability = event.data;
    if (!ability) {
      return;
    }

    await onAbilityAdd(ability);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const getRowClass = () => {
    return 'cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700';
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
            Click any ability to add it immediately to your app version.
            {existingAbilities.length > 0 &&
              ` (${existingAbilities.length} abilities already added)`}
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
              columnDefs={TOOL_GRID_COLUMNS}
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

        <div className={`flex justify-end gap-2 pt-4 border-t ${theme.cardBorder} flex-shrink-0`}>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
