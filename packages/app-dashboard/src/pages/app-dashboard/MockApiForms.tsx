import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAccount } from 'wagmi';
import { ArrowLeft } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/app-dashboard/ui/card';

// Import all the form components
import {
  EditAppForm,
  GetAppForm,
  DeleteAppForm,
  CreateAppVersionForm,
  GetAppVersionsForm,
  EditAppVersionForm,
  GetAllAppsForm,
} from '@/components/app-dashboard/mock-forms/generic/AppForms';

import {
  EditToolForm,
  CreateToolVersionForm,
  GetToolForm,
  GetAllToolsForm,
  GetToolVersionsForm,
  ChangeToolOwnerForm,
  GetToolVersionForm,
  EditToolVersionForm,
} from '@/components/app-dashboard/mock-forms/generic/ToolForms';

import {
  EditPolicyForm,
  CreatePolicyVersionForm,
  GetPolicyForm,
  GetAllPoliciesForm,
  GetPolicyVersionsForm,
  ChangePolicyOwnerForm,
  GetPolicyVersionForm,
  EditPolicyVersionForm,
} from '@/components/app-dashboard/mock-forms/generic/PolicyForms';

// Form mapping
const formMapping: {
  [key: string]: { component: React.ComponentType; title: string; description: string };
} = {
  // App forms
  'get-app': {
    component: GetAppForm,
    title: 'Get App',
    description: 'Retrieve app information by ID',
  },
  'get-all-apps': {
    component: GetAllAppsForm,
    title: 'Get All Apps',
    description: 'Retrieve all apps from the API',
  },
  'edit-app': {
    component: EditAppForm,
    title: 'Edit App',
    description: 'Update an existing app',
  },
  'delete-app': {
    component: DeleteAppForm,
    title: 'Delete App',
    description: 'Delete an app by ID',
  },
  'get-app-versions': {
    component: GetAppVersionsForm,
    title: 'Get App Versions',
    description: 'Retrieve all versions of an app',
  },
  'create-app-version': {
    component: CreateAppVersionForm,
    title: 'Create App Version',
    description: 'Create a new version of an app',
  },
  'edit-app-version': {
    component: EditAppVersionForm,
    title: 'Edit App Version',
    description: 'Update an existing app version',
  },

  // Tool forms
  'get-tool': {
    component: GetToolForm,
    title: 'Get Tool',
    description: 'Retrieve tool information by package name',
  },
  'get-all-tools': {
    component: GetAllToolsForm,
    title: 'Get All Tools',
    description: 'Retrieve all tools from the API',
  },
  'edit-tool': {
    component: EditToolForm,
    title: 'Edit Tool',
    description: 'Update an existing tool',
  },
  'get-tool-versions': {
    component: GetToolVersionsForm,
    title: 'Get Tool Versions',
    description: 'Retrieve all versions of a tool',
  },
  'create-tool-version': {
    component: CreateToolVersionForm,
    title: 'Create Tool Version',
    description: 'Create a new version of a tool',
  },
  'get-tool-version': {
    component: GetToolVersionForm,
    title: 'Get Tool Version',
    description: 'Retrieve a specific tool version',
  },
  'edit-tool-version': {
    component: EditToolVersionForm,
    title: 'Edit Tool Version',
    description: 'Update an existing tool version',
  },
  'change-tool-owner': {
    component: ChangeToolOwnerForm,
    title: 'Change Tool Owner',
    description: 'Transfer tool ownership to another wallet',
  },

  // Policy forms
  'get-policy': {
    component: GetPolicyForm,
    title: 'Get Policy',
    description: 'Retrieve policy information by package name',
  },
  'get-all-policies': {
    component: GetAllPoliciesForm,
    title: 'Get All Policies',
    description: 'Retrieve all policies from the API',
  },
  'edit-policy': {
    component: EditPolicyForm,
    title: 'Edit Policy',
    description: 'Update an existing policy',
  },
  'get-policy-versions': {
    component: GetPolicyVersionsForm,
    title: 'Get Policy Versions',
    description: 'Retrieve all versions of a policy',
  },
  'create-policy-version': {
    component: CreatePolicyVersionForm,
    title: 'Create Policy Version',
    description: 'Create a new version of a policy',
  },
  'get-policy-version': {
    component: GetPolicyVersionForm,
    title: 'Get Policy Version',
    description: 'Retrieve a specific policy version',
  },
  'edit-policy-version': {
    component: EditPolicyVersionForm,
    title: 'Edit Policy Version',
    description: 'Update an existing policy version',
  },
  'change-policy-owner': {
    component: ChangePolicyOwnerForm,
    title: 'Change Policy Owner',
    description: 'Transfer policy ownership to another wallet',
  },
};

export default function MockApiFormsPage() {
  const { formType, appId } = useParams();
  const navigate = useNavigate();
  const { isConnected } = useAccount();

  // If we have an appId in the URL, use the existing container
  if (appId) {
    const {
      MockApiFormsContainer,
    } = require('@/components/app-dashboard/mock-forms/MockApiFormsContainer');
    return <MockApiFormsContainer />;
  }

  // Handle form type routing
  if (!formType || !formMapping[formType]) {
    return (
      <div className="flex h-screen">
        <div className="w-80 bg-white border-r border-gray-200">
          <div className="p-6">
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-800 mb-6 flex items-center"
            >
              ← Back to Dashboard
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Vincent</h2>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Form Not Found</CardTitle>
                <CardDescription>The requested form could not be found.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Available forms:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {Object.keys(formMapping).map((key) => (
                    <li key={key} className="text-sm text-gray-600">
                      <button
                        onClick={() => navigate(`/mock-api-forms/${key}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {formMapping[key].title}
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const formConfig = formMapping[formType];
  const FormComponent = formConfig.component;

  return (
    <>
      {!isConnected && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">Please connect your wallet to use the API forms.</p>
        </div>
      )}

      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200">
          <div className="p-6">
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-800 mb-6 flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Vincent</h2>
            <nav className="space-y-2">
              <div className="w-full flex items-center px-4 py-2 text-left rounded-lg border border-gray-300 text-gray-900">
                {formConfig.title}
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <FormComponent />
          </div>
        </div>
      </div>
    </>
  );
}
