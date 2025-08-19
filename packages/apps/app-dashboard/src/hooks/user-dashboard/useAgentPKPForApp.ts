import { useEffect, useState } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import { getAgentPKPs, getAgentPKPForApp } from '../../utils/user-dashboard/getAgentPKP';

export function useAgentPKPForApp(userAddress: string | undefined, appId: number | undefined) {
  const [agentPKP, setAgentPKP] = useState<IRelayPKP | null>(null);
  const [isLastUnpermittedPKP, setIsLastUnpermittedPKP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userAddress || appId === undefined) {
      setAgentPKP(null);
      setIsLastUnpermittedPKP(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchAgentPKP = async () => {
      try {
        const agentPkpResult = await getAgentPKPs(userAddress);
        const { pkp, isLastUnpermittedPKP: isLast } = getAgentPKPForApp(agentPkpResult, appId);
        setAgentPKP(pkp);
        setIsLastUnpermittedPKP(isLast);
      } catch (err) {
        setError(err as Error);
        setAgentPKP(null);
        setIsLastUnpermittedPKP(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentPKP();
  }, [userAddress, appId]);

  return { agentPKP, isLastUnpermittedPKP, loading, error };
}
