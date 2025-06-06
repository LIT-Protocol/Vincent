import { useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  SelectionChangedEvent,
  GridReadyEvent,
  GridApi,
  IRowNode,
  ModuleRegistry,
  AllCommunityModule,
} from 'ag-grid-community';
import { vincentApiClient } from '../vincentApiClient';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface EntitySelectorProps {
  entityType: 'tool' | 'policy';
  selectedEntities: string[]; // Array of package names
  onChange: (selectedEntities: string[]) => void;
  error?: string;
  disabled?: boolean;
}

export function EntitySelector({
  entityType,
  selectedEntities,
  onChange,
  error,
  disabled,
}: EntitySelectorProps) {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Use the actual API hooks
  const [listAllTools] = vincentApiClient.useLazyListAllToolsQuery();
  const [listAllPolicies] = vincentApiClient.useLazyListAllPoliciesQuery();

  // Fetch entities on component mount
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        setLoading(true);
        setFetchError(null);

        let result;
        if (entityType === 'tool') {
          result = await listAllTools().unwrap();
        } else {
          result = await listAllPolicies().unwrap();
        }

        setEntities(result);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : `Failed to fetch ${entityType}s`);
      } finally {
        setLoading(false);
      }
    };

    fetchEntities();
  }, [entityType, listAllTools, listAllPolicies]);

  // Column definitions for AG Grid
  const columnDefs: ColDef[] = useMemo(() => {
    const baseColumns: ColDef[] = [
      {
        headerName: 'Package Name',
        field: 'packageName',
        flex: 2,
        minWidth: 250,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Version',
        field: 'activeVersion',
        flex: 0.8,
        minWidth: 80,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Description',
        field: 'description',
        flex: 3,
        minWidth: 300,
        filter: true,
        tooltipField: 'description',
      },
    ];

    // Add entity-specific title column
    if (entityType === 'tool') {
      baseColumns.unshift({
        headerName: 'Tool Name',
        field: 'title',
        flex: 2,
        minWidth: 200,
        sortable: true,
        filter: true,
      });
    } else if (entityType === 'policy') {
      baseColumns.unshift({
        headerName: 'Policy Name',
        field: 'policyTitle',
        flex: 2,
        minWidth: 200,
        sortable: true,
        filter: true,
      });
    }

    return baseColumns;
  }, [entityType]);

  // Handle grid ready
  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      setGridApi(params.api);

      // Pre-select rows based on selectedEntities (package names)
      if (selectedEntities.length > 0) {
        params.api.forEachNode((node: IRowNode) => {
          const entityPackageName = node.data?.packageName;
          if (entityPackageName && selectedEntities.includes(entityPackageName)) {
            node.setSelected(true);
          }
        });
      }
    },
    [selectedEntities],
  );

  // Handle selection changes
  const onSelectionChanged = useCallback(
    (event: SelectionChangedEvent) => {
      const selectedRows = event.api.getSelectedRows();
      const selectedPackageNames = selectedRows.map((entity: any) => entity.packageName);
      onChange(selectedPackageNames);
    },
    [onChange],
  );

  // Update selection when selectedEntities prop changes
  useEffect(() => {
    if (gridApi) {
      gridApi.forEachNode((node: IRowNode) => {
        const entityPackageName = node.data?.packageName;
        const shouldBeSelected = entityPackageName && selectedEntities.includes(entityPackageName);
        if (node.isSelected() !== shouldBeSelected) {
          node.setSelected(!!shouldBeSelected);
        }
      });
    }
  }, [selectedEntities, gridApi]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Available {entityType === 'tool' ? 'Tools' : 'Policies'}
        <span className="text-gray-500 ml-1">({selectedEntities.length} selected)</span>
      </label>

      {loading && (
        <div className="flex items-center justify-center p-8 text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
          Loading {entityType}s...
        </div>
      )}

      {fetchError && (
        <div className="text-sm text-red-600 p-4 bg-red-50 rounded border">
          Error loading {entityType}s: {fetchError}
        </div>
      )}

      {!loading && !fetchError && (
        <div
          className={`ag-theme-alpine ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
          style={{ height: 400, width: '100%' }}
        >
          <AgGridReact
            rowData={entities}
            columnDefs={columnDefs}
            rowSelection={{
              mode: 'multiRow',
              checkboxes: true,
              headerCheckbox: true,
              enableClickSelection: true,
            }}
            onGridReady={onGridReady}
            onSelectionChanged={onSelectionChanged}
            pagination={false}
            animateRows={true}
            tooltipShowDelay={500}
          />
        </div>
      )}

      {selectedEntities.length > 0 && (
        <div className="text-sm text-gray-600">
          <strong>Selected {entityType}s:</strong> {selectedEntities.join(', ')}
        </div>
      )}

      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
