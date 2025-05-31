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
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { EntityType, EntityDataShape } from './types';
import { ENTITY_CONFIGS } from './entityConfigs';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Type alias for the entities we can select (excluding apps)
type EntityData = EntityDataShape<'tool'> | EntityDataShape<'policy'>;

interface EntitySelectorProps {
  entityType: Exclude<EntityType, 'app'>; // Apps don't need selection grids
  selectedEntities: string[]; // Array of package names
  onChange: (selectedEntities: string[]) => void;
  error?: string;
  disabled?: boolean;
}

// Import the existing mock functions from EntityForms to ensure consistency
// (In a real implementation, these would be imported from the actual EntityForms module)
const mockGetAllFunctions = {
  tool: async (): Promise<string[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [
      '@vincent/file-upload',
      '@vincent/data-validator',
      '@vincent/tool-data-fetch',
      '@vincent/tool-email-sender',
      '@vincent/tool-file-processor',
      '@vincent/tool-database-query',
      '@vincent/tool-webhook-handler',
      '@vincent/tool-image-processor',
      '@vincent/tool-text-analyzer',
      '@vincent/tool-scheduler',
    ];
  },
  policy: async (): Promise<string[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [
      '@vincent/kyc-verification',
      '@vincent/risk-assessment',
      '@vincent/policy-data-privacy',
      '@vincent/policy-rate-limiting',
      '@vincent/policy-authentication',
      '@vincent/policy-logging',
      '@vincent/policy-validation',
      '@vincent/policy-caching',
    ];
  },
};

const mockGetFunctions = {
  tool: async (packageName: string): Promise<EntityDataShape<'tool'>> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Use consistent data with EntityForms
    const toolDetails: Record<string, Omit<EntityDataShape<'tool'>, 'packageName'>> = {
      '@vincent/file-upload': {
        toolTitle: 'File Upload Tool',
        authorWalletAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
        description: 'Upload files to IPFS with validation',
        activeVersion: '1.2.0',
      },
      '@vincent/data-validator': {
        toolTitle: 'Data Validator Tool',
        authorWalletAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
        description: 'Validate data against schemas',
        activeVersion: '2.1.3',
      },
      // For other tools, fall back to the generic sample data used in EntityForms
      [packageName]: {
        toolTitle: 'Sample Tool',
        authorWalletAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
        description: 'This tool is a foo bar tool',
        activeVersion: '1.0.0',
      },
    };

    const details = toolDetails[packageName] ||
      toolDetails[packageName] || {
        toolTitle: 'Sample Tool',
        authorWalletAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
        description: 'This tool is a foo bar tool',
        activeVersion: '1.0.0',
      };

    return { packageName, ...details };
  },

  policy: async (packageName: string): Promise<EntityDataShape<'policy'>> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Use consistent data with EntityForms
    const policyDetails: Record<string, Omit<EntityDataShape<'policy'>, 'packageName'>> = {
      '@vincent/kyc-verification': {
        policyTitle: 'KYC Verification Policy',
        authorWalletAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
        description: 'Know Your Customer verification policy for user onboarding',
        activeVersion: '2.1.0',
      },
      '@vincent/risk-assessment': {
        policyTitle: 'Risk Assessment Policy',
        authorWalletAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
        description: 'Automated risk assessment for financial transactions',
        activeVersion: '1.5.3',
      },
      '@vincent/policy-data-privacy': {
        policyTitle: 'Data Privacy Policy',
        authorWalletAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
        description: 'Enforce data privacy regulations and PII protection',
        activeVersion: '2.1.0',
      },
      '@vincent/policy-rate-limiting': {
        policyTitle: 'Rate Limiting Policy',
        authorWalletAddress: '0xb834519fDB396a55aCd843D276daEa0d787F8db5',
        description: 'Control API request rates and prevent abuse',
        activeVersion: '1.5.0',
      },
      '@vincent/policy-authentication': {
        policyTitle: 'Authentication Policy',
        authorWalletAddress: '0xc945620eEC396a55aCd843D276daEa0d787F8db5',
        description: 'Manage user authentication and authorization',
        activeVersion: '3.0.1',
      },
      '@vincent/policy-logging': {
        policyTitle: 'Logging Policy',
        authorWalletAddress: '0xd056731ffD396a55aCd843D276daEa0d787F8db5',
        description: 'Configure application logging and audit trails',
        activeVersion: '1.2.3',
      },
      '@vincent/policy-validation': {
        policyTitle: 'Input Validation Policy',
        authorWalletAddress: '0xe167842ggE396a55aCd843D276daEa0d787F8db5',
        description: 'Validate and sanitize user inputs',
        activeVersion: '2.0.0',
      },
      '@vincent/policy-caching': {
        policyTitle: 'Caching Policy',
        authorWalletAddress: '0xf278953hhF396a55aCd843D276daEa0d787F8db5',
        description: 'Manage application caching strategies',
        activeVersion: '1.0.0',
      },
      // For other policies, fall back to the generic sample data used in EntityForms
      [packageName]: {
        policyTitle: 'Sample Policy',
        authorWalletAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
        description: 'This policy is a foo bar policy',
        activeVersion: '1.0.0',
      },
    };

    const details = policyDetails[packageName] || {
      policyTitle: 'Sample Policy',
      authorWalletAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
      description: 'This policy is a foo bar policy',
      activeVersion: '1.0.0',
    };

    return { packageName, ...details };
  },
};

export function EntitySelector({
  entityType,
  selectedEntities,
  onChange,
  error,
  disabled,
}: EntitySelectorProps) {
  const config = ENTITY_CONFIGS[entityType];
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [entities, setEntities] = useState<EntityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch entities on component mount
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        setLoading(true);
        setFetchError(null);

        // Step 1: Get all entity package names using existing system
        const packageNames = await mockGetAllFunctions[entityType]();

        // Step 2: Fetch individual entity details using existing system
        const entityPromises = packageNames.map((packageName) =>
          mockGetFunctions[entityType](packageName),
        );
        const entityDetails = await Promise.all(entityPromises);

        setEntities(entityDetails);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : `Failed to fetch ${config.name}s`);
      } finally {
        setLoading(false);
      }
    };

    fetchEntities();
  }, [entityType, config.name]);

  // Column definitions for AG Grid - adapt based on entity type
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
        field: 'toolTitle',
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

  // Grid options
  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    [],
  );

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
      const selectedPackageNames = selectedRows.map((entity: EntityData) => entity.packageName);
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
        Available {config.displayName}s
        <span className="text-gray-500 ml-1">({selectedEntities.length} selected)</span>
      </label>

      {loading && (
        <div className="flex items-center justify-center p-8 text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
          Loading {config.name}s...
        </div>
      )}

      {fetchError && (
        <div className="text-sm text-red-600 p-4 bg-red-50 rounded border">
          Error loading {config.name}s: {fetchError}
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
            defaultColDef={defaultColDef}
            rowSelection={{
              mode: 'multiRow',
              checkboxes: true,
              headerCheckbox: true,
              enableClickSelection: true,
            }}
            onGridReady={onGridReady}
            onSelectionChanged={onSelectionChanged}
            pagination={false}
            suppressRowClickSelection={false}
            enableRangeSelection={false}
            animateRows={true}
            tooltipShowDelay={500}
            domLayout="normal"
            theme="legacy"
          />
        </div>
      )}

      {selectedEntities.length > 0 && (
        <div className="text-sm text-gray-600">
          <strong>Selected {config.name}s:</strong> {selectedEntities.join(', ')}
        </div>
      )}

      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
