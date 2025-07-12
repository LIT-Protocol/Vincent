import { useParams } from 'react-router-dom';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/layout/Loading';
import { ManageDelegateesForm } from '../forms/ManageDelegateesForm';
import { useBlockchainAppData } from '@/hooks/useBlockchainAppData';

export function ManageDelegateesWrapper() {
  const { appId } = useParams<{ appId: string }>();

  // Fetching on-chain data
  const {
    blockchainAppData,
    blockchainAppError,
    blockchainAppLoading,
    refetch: refetchBlockchainData,
  } = useBlockchainAppData(appId);

  // Loading
  if (blockchainAppLoading) return <Loading />;
  if (blockchainAppError) return <StatusMessage message="Failed to load app" type="error" />;
  if (!blockchainAppData) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  return (
    <ManageDelegateesForm
      appData={blockchainAppData.delegatees}
      refetchBlockchainData={refetchBlockchainData}
    />
  );
}
