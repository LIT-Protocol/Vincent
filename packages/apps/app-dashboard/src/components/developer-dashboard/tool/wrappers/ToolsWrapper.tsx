import { useUserTools } from '@/hooks/developer-dashboard/tool/useUserTools';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { ToolsListView } from '../views/ToolsListView';

export function ToolsWrapper() {
  const {
    data: tools,
    deletedTools,
    isLoading: toolsLoading,
    isError: toolsError,
  } = useUserTools();

  // Loading states first
  if (toolsLoading) return <Loading />;

  // Combined error states
  if (toolsError) return <StatusMessage message="Failed to load tools" type="error" />;

  return <ToolsListView tools={tools} deletedTools={deletedTools} />;
}
