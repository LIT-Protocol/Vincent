import { useEffect, useState } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import { getAgentPKPs, AgentAppPermission } from '../../utils/user-dashboard/getAgentPKP';

export function useAllAgentApps(userAddress: string | undefined) {
  const [permittedPKPs, setPermittedPKPs] = useState<AgentAppPermission[]>([]);
  const [unpermittedPKPs, setUnpermittedPKPs] = useState<IRelayPKP[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userAddress) {
      setPermittedPKPs([]);
      setUnpermittedPKPs([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchAllPermissions = async () => {
      try {
        const agentPkpResult = await getAgentPKPs(userAddress);

        setPermittedPKPs(agentPkpResult.permitted);
        setUnpermittedPKPs(agentPkpResult.unpermitted);
      } catch (err) {
        setError(err as Error);
        setPermittedPKPs([]);
        setUnpermittedPKPs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPermissions();
  }, [userAddress]);

  return { permittedPKPs, unpermittedPKPs, loading, error };
}
