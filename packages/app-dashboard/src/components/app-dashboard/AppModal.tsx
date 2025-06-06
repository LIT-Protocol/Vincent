import { useNavigate } from 'react-router';
import { AppViewType } from '@/types/app-dashboard/viewTypes';
import {
  EditAppForm,
  DeleteAppForm,
  CreateAppVersionForm,
  EditAppVersionForm,
} from '@/components/app-dashboard/mock-forms/generic/AppForms';

const formComponents: Record<
  string,
  {
    component: React.ComponentType<any>;
    title: string;
    description: string;
  }
> = {
  [AppViewType.APP_EDIT]: {
    component: EditAppForm,
    title: 'Edit App',
    description: 'Update app details and configuration',
  },
  [AppViewType.APP_DELETE]: {
    component: DeleteAppForm,
    title: 'Delete App',
    description: 'Permanently delete this application',
  },
  [AppViewType.APP_CREATE_VERSION]: {
    component: CreateAppVersionForm,
    title: 'Create App Version',
    description: 'Create a new version of this app',
  },
  [AppViewType.APP_EDIT_VERSION]: {
    component: EditAppVersionForm,
    title: 'Edit App Version',
    description: 'Update an existing app version',
  },
};

interface AppModalProps {
  viewType: AppViewType;
  versionId: number | null;
  appId: number;
  app: any;
  onClose: () => void;
}

export function AppModal({ viewType, versionId, appId, app, onClose }: AppModalProps) {
  const navigate = useNavigate();

  const modalType =
    viewType === AppViewType.APP_EDIT && versionId ? AppViewType.APP_EDIT_VERSION : viewType;

  // Don't render modal for non-modal views
  if (
    !formComponents[modalType] ||
    [AppViewType.APP_DETAILS, AppViewType.APP_VERSIONS, AppViewType.APP_VERSION].includes(viewType)
  ) {
    return null;
  }

  const FormComponent = formComponents[modalType].component;
  const config = formComponents[modalType];

  const handleClose = () => {
    const baseUrl = versionId ? `/appId/${appId}/version/${versionId}` : `/appId/${appId}`;
    navigate(baseUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
              <p className="text-gray-600">{config.description}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
          <FormComponent appData={app} />
        </div>
      </div>
    </div>
  );
}
