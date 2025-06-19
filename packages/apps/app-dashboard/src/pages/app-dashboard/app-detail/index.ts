import AppOverview from './AppOverview';
import AppVersions from './AppVersions';
import AppVersionDetail from './AppVersionDetail';
import AppEdit from './AppEdit';
import AppDelete from './AppDelete';
import AppCreateVersion from './AppCreateVersion';

export const AppDetail = {
  Overview: AppOverview,
  Versions: AppVersions,
  Version: AppVersionDetail,
  Edit: AppEdit,
  Delete: AppDelete,
  CreateVersion: AppCreateVersion,
};

// Also export individually for flexibility
export { AppOverview, AppVersions, AppVersionDetail, AppEdit, AppDelete, AppCreateVersion };
