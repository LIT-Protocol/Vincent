import { useLocation, useParams } from 'react-router';
import { AppViewType } from '@/types/app-dashboard/viewTypes';

export function useViewType() {
  const location = useLocation();
  const params = useParams();

  const versionId = params.versionId ? parseInt(params.versionId) : null;

  const getViewType = (): AppViewType => {
    const path = location.pathname;

    if (path.endsWith('/edit-app')) return AppViewType.APP_EDIT;
    if (path.endsWith('/delete-app')) return AppViewType.APP_DELETE;
    if (path.endsWith('/create-app-version')) return AppViewType.APP_CREATE_VERSION;
    if (path.endsWith('/versions')) return AppViewType.APP_VERSIONS;
    if (versionId) return AppViewType.APP_VERSION;

    return AppViewType.APP_DETAILS;
  };

  return {
    viewType: getViewType(),
    versionId,
  };
}
