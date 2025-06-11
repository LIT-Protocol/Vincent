import DashboardHome from './DashboardHome';
import AppsPage from './AppsPage';
import ToolsPage from './ToolsPage';
import PoliciesPage from './PoliciesPage';
import CreateAppPage from './CreateAppPage';
import CreateToolPage from './CreateToolPage';
import CreatePolicyPage from './CreatePolicyPage';

export const AppDashboard = {
  Home: DashboardHome,
  Apps: AppsPage,
  Tools: ToolsPage,
  Policies: PoliciesPage,
  CreateApp: CreateAppPage,
  CreateTool: CreateToolPage,
  CreatePolicy: CreatePolicyPage,
};

// Also export individually for flexibility
export {
  DashboardHome,
  AppsPage,
  ToolsPage,
  PoliciesPage,
  CreateAppPage,
  CreateToolPage,
  CreatePolicyPage,
};
