import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAccount } from 'wagmi';
import { Helmet } from 'react-helmet';
import { Plus, Wrench, Shield } from 'lucide-react';

import { CreateAppForm } from '@/components/app-dashboard/mock-forms/generic/AppForms';
import { CreateToolForm } from '@/components/app-dashboard/mock-forms/generic/ToolForms';
import { CreatePolicyForm } from '@/components/app-dashboard/mock-forms/generic/PolicyForms';

// Form components mapping
const formComponents: {
  [key: string]: {
    component: React.ComponentType;
    title: string;
    description: string;
  };
} = {
  'create-app': {
    component: CreateAppForm,
    title: 'Create App',
    description: 'Create a new blockchain application',
  },
  'create-tool': {
    component: CreateToolForm,
    title: 'Create Tool',
    description: 'Create a new tool for Vincent applications',
  },
  'create-policy': {
    component: CreatePolicyForm,
    title: 'Create Policy',
    description: 'Create a new access policy',
  },
};

// Menu items for creation
const createMenuItems = [
  { id: 'create-app', label: 'Create App', icon: Plus },
  { id: 'create-tool', label: 'Create Tool', icon: Wrench },
  { id: 'create-policy', label: 'Create Policy', icon: Shield },
];

export function CreateApp() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  const [selectedForm, setSelectedForm] = useState<string>('create-app');

  useEffect(() => {
    if (!isConnected) {
      navigate('/', { replace: true });
    }
  }, [isConnected, navigate]);

  const handleMenuSelection = (id: string) => {
    setSelectedForm(id);
  };

  if (!isConnected) {
    navigate('/');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Vincent | Create</title>
        <meta
          name="description"
          content="Create new applications, tools, and policies for Vincent"
        />
      </Helmet>

      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200">
          <div className="p-6">
            <nav className="space-y-2">
              {createMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuSelection(item.id)}
                    className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
                      selectedForm === item.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {formComponents[selectedForm] ? (
              (() => {
                const FormComponent = formComponents[selectedForm].component;
                return <FormComponent />;
              })()
            ) : (
              <div className="flex items-center justify-center py-8">
                <span className="text-gray-600">Select a creation option from the sidebar</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateApp;
