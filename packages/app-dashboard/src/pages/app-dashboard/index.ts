import DashboardHome from './DashboardHome';
import ConnectWalletPage from './home';
import DashboardPage from './DashboardPage';
import AppsPage from './AppsPage';
import ToolsPage from './ToolsPage';
import PoliciesPage from './PoliciesPage';
import CreateAppPage from './CreateAppPage';
import CreateToolPage from './CreateToolPage';
import CreatePolicyPage from './CreatePolicyPage';

export const AppDashboard = {
  Home: DashboardHome,
  ConnectWallet: ConnectWalletPage,
  Dashboard: DashboardPage,
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
  ConnectWalletPage,
  DashboardPage,
  AppsPage,
  ToolsPage,
  PoliciesPage,
  CreateAppPage,
  CreateToolPage,
  CreatePolicyPage,
};
