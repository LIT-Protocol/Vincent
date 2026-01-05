import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  ICellRendererParams,
  ModuleRegistry,
  AllCommunityModule,
  RowClickedEvent,
} from 'ag-grid-community';

import { Ability, AbilityVersion } from '@/types/developer-dashboard/appTypes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { theme, fonts } from '@/lib/themeClasses';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useMemo } from 'react';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Column definitions - need to be created inside component to access ability
const createVersionGridColumns = (activeVersion?: string): ColDef[] => [
  {
    headerName: 'Version',
    field: 'version',
    flex: 1,
    minWidth: 150,
    cellRenderer: (params: ICellRendererParams) => {
      const isActive = params.value === activeVersion;
      return (
        <div className="flex items-center gap-2 h-full">
          <div className="font-medium">v{params.value}</div>
          {isActive && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: theme.brandOrange, color: 'white' }}
            >
              Active
            </span>
          )}
        </div>
      );
    },
  },
  {
    headerName: 'Created Date',
    field: 'createdAt',
    flex: 2,
    minWidth: 200,
    cellRenderer: (params: ICellRendererParams) => {
      return (
        <div className="flex items-center h-full">
          <span className="text-gray-600 dark:text-gray-400">
            {new Date(params.value).toLocaleString()}
          </span>
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

interface AbilityVersionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVersionSelect: (version: string) => Promise<void>;
  ability: Ability | null;
}

export function AbilityVersionSelectorModal({
  isOpen,
  onClose,
  onVersionSelect,
  ability,
}: AbilityVersionSelectorModalProps) {
  const {
    data: versions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetAbilityVersionsQuery(
    { packageName: ability?.packageName || '' },
    { skip: !ability?.packageName },
  );

  // Filter out deleted versions and sort with active version first
  const activeVersions = useMemo(() => {
    if (!versions?.length) return [];
    const filtered = versions.filter((version: AbilityVersion) => !version.isDeleted);

    // Sort: active version first, then by version string descending
    return filtered.sort((a, b) => {
      const isAActive = a.version === ability?.activeVersion;
      const isBActive = b.version === ability?.activeVersion;

      if (isAActive && !isBActive) return -1;
      if (!isAActive && isBActive) return 1;

      return b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [versions, ability?.activeVersion]);

  const handleRowClick = async (event: RowClickedEvent) => {
    const version = event.data;
    if (!version) {
      return;
    }

    await onVersionSelect(version.version);
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
        className={`w-[70vw] max-w-4xl h-[60vh] flex flex-col !max-w-none ${theme.mainCard}`}
        style={{ width: '70vw', maxWidth: '56rem' }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className={`text-lg font-semibold ${theme.text}`} style={fonts.heading}>
            Select Version for {ability?.title || ability?.packageName}
          </DialogTitle>
          <DialogDescription className={`${theme.textMuted}`} style={fonts.body}>
            Click any version to select it for this ability.
          </DialogDescription>
        </DialogHeader>

        <div className={`flex-1 min-h-0 border ${theme.mainCardBorder} rounded-lg overflow-hidden`}>
          {versionsLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loading />
            </div>
          ) : versionsError ? (
            <div className="h-full flex items-center justify-center">
              <StatusMessage message="Failed to load versions" type="error" />
            </div>
          ) : activeVersions.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <StatusMessage message="No active versions available" type="info" />
            </div>
          ) : (
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
                rowData={activeVersions}
                columnDefs={createVersionGridColumns(ability?.activeVersion)}
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
          )}
        </div>

        <div className={`flex justify-end gap-2 pt-4 border-t ${theme.cardBorder} flex-shrink-0`}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
