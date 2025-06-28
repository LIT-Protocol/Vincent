import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  ICellRendererParams,
  ModuleRegistry,
  AllCommunityModule,
  RowClickedEvent,
} from 'ag-grid-community';
import { Tool } from '@/types/developer-dashboard/appTypes';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Static column definitions
const TOOL_GRID_COLUMNS: ColDef[] = [
  {
    headerName: 'Tool Name',
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
            className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-mono cursor-pointer"
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
          <div className="text-sm text-gray-600" title={params.value}>
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

interface ToolSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToolAdd: (tool: Tool) => Promise<void>;
  existingTools: string[];
  availableTools: Tool[];
}

export function ToolSelectorModal({
  isOpen,
  onClose,
  onToolAdd,
  existingTools,
  availableTools,
}: ToolSelectorModalProps) {
  // Filter out already added tools
  const filteredTools = availableTools.filter((tool) => !existingTools.includes(tool.packageName));

  const handleRowClick = async (event: RowClickedEvent) => {
    const tool = event.data;
    if (!tool) {
      return;
    }

    await onToolAdd(tool);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const getRowClass = () => {
    return 'cursor-pointer hover:bg-gray-50';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[85vw] max-w-6xl h-[70vh] flex flex-col !max-w-none"
        style={{ width: '85vw', maxWidth: '72rem' }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add Tools to App Version</DialogTitle>
          <DialogDescription>
            Click any tool to add it immediately to your app version.
            {existingTools.length > 0 && ` (${existingTools.length} tools already added)`}
            {filteredTools.length < availableTools.length &&
              ` • Showing ${filteredTools.length} of ${availableTools.length} available tools`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <div className="ag-theme-alpine h-full w-full">
            <AgGridReact
              rowData={filteredTools}
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

        <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
