import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAccount } from 'wagmi';
import { Helmet } from 'react-helmet';

import { CreateToolForm } from '@/components/app-dashboard/mock-forms/generic';

export function CreateTool() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  const goToRoot = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!isConnected) {
      goToRoot();
    }
  }, [isConnected, goToRoot]);

  return (
    <>
      <Helmet>
        <title>Vincent | Create Tool</title>
        <meta name="description" content="Create a new tool for Vincent" />
      </Helmet>

      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200">
          <div className="p-6">
            <button
              onClick={goToRoot}
              className="text-blue-600 hover:text-blue-800 mb-6 flex items-center"
            >
              ← Back to Dashboard
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Vincent</h2>
            <nav className="space-y-2">
              <div className="w-full flex items-center px-4 py-2 text-left rounded-lg border border-gray-300 text-gray-900">
                Create Tool
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <CreateToolForm />
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateTool;
