import { useEffect, useState } from 'react';
import { useLitContext } from '@/providers/LitContext';
import { ArrowRight, Plus } from 'lucide-react';
import { createDatilChainManager } from '@lit-protocol/vincent-contracts';
import { StateWrapper } from './StateWrapper';
import Link from 'next/link';

type GetAppsByManagerReturn = Awaited<
  ReturnType<
    ReturnType<
      typeof createDatilChainManager
    >['vincentApi']['appManagerDashboard']['getAppsByManager']
  >
>;

/**
 * GetAppsByManager - Component to display a list of apps from the chain manager
 * using simple HTML tables without custom styles
 */
export function GetAppsByManager() {
  const { chainManager, connectedAddress } = useLitContext();
  const [apps, setApps] = useState<GetAppsByManagerReturn>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getApps() {
      if (chainManager && connectedAddress) {
        setLoading(true);
        setError(null);

        try {
          const fetchedApps =
            await chainManager.vincentApi.appManagerDashboard.getAppsByManager({
              manager: connectedAddress,
            });

          setApps(fetchedApps);
          console.log('Apps fetched:', fetchedApps);
        } catch (err) {
          console.error('Error fetching apps:', err);
          setError('Failed to load your applications. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    }

    getApps();
  }, [chainManager, connectedAddress]);

  // Helper function to truncate long addresses/strings
  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <StateWrapper
      loading={loading}
      error={error}
      isEmpty={apps.length === 0}
      loadingLabel="Loading Applications"
      emptyComponent={<>No Apps Found!</>}
      errorConfig={{
        onRetry: () => window.location.reload(),
      }}
    >
      {/* Simple table layout to display apps */}
      <div>
        <table cellPadding="8" cellSpacing="0" width="100%">
          <thead>
            <tr>
              <th>App Name</th>
              <th>ID</th>
              <th>Description</th>
              <th>Manager</th>
              <th>Latest Version</th>
              <th>Delegatees</th>
              <th>Authorized Redirect URIs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((appData, index) => (
              <tr key={appData.app.id || index}>
                <td>{appData.app.name || 'Unnamed App'}</td>
                <td>{appData.app.id.toString()}</td>
                <td>{appData.app.description || 'No description provided'}</td>
                <td>{appData.app.manager}</td>
                <td>{appData.app.latestVersion.toString()}</td>
                <td>
                  {appData.app.delegatees.length > 0 ? (
                    <ul>
                      {appData.app.delegatees
                        .slice(0, 3)
                        .map((delegatee, idx) => (
                          <li key={idx}>{truncateAddress(delegatee)}</li>
                        ))}
                      {appData.app.delegatees.length > 3 && (
                        <li>+{appData.app.delegatees.length - 3} more</li>
                      )}
                    </ul>
                  ) : (
                    'No delegatees'
                  )}
                </td>
                <td>
                  {appData.app.authorizedRedirectUris.length > 0 ? (
                    <ul>
                      {appData.app.authorizedRedirectUris
                        .slice(0, 2)
                        .map((uri, idx) => (
                          <li key={idx}>{uri}</li>
                        ))}
                      {appData.app.authorizedRedirectUris.length > 2 && (
                        <li>
                          +{appData.app.authorizedRedirectUris.length - 2} more
                        </li>
                      )}
                    </ul>
                  ) : (
                    'No authorized redirect URIs'
                  )}
                </td>
                <td>
                  <Link href={`/app/${appData.app.id.toString()}`}>
                    <button>
                      Manage App <ArrowRight size={16} />
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Create New App button as a simple HTML element */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <h3>Create New App</h3>
          <p>Create a new application to manage</p>
          <button>
            <Plus size={16} /> Create App
          </button>
        </div>
      </div>
    </StateWrapper>
  );
}

export default GetAppsByManager;
