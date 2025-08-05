import { Card, CardContent } from '@/components/shared/ui/card';
import { AlertTriangle, Home, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ResourceNotOwnedErrorProps = {
  resourceType: 'app' | 'ability' | 'policy';
  resourceName?: string;
  resourceId?: string;
  errorDetails?: string;
};

export function ResourceNotOwnedError({ resourceType, errorDetails }: ResourceNotOwnedErrorProps) {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate('/developer/dashboard');
  };

  const handleContactSupport = () => {
    window.open('https://t.me/+aa73FAF9Vp82ZjJh', '_blank');
  };

  return (
    <div className="w-full p-4">
      {/* Main Card Container */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-800 border border-gray-200 dark:border-white/10 rounded-2xl shadow-lg overflow-hidden">
        {/* Main Content */}
        <div className="px-6 py-8 space-y-6">
          {/* Error Info Card */}
          <Card className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-white/10">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <Shield className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-white">
                      Access Denied
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-white/60 mt-1">
                      You don't have permission to access this {resourceType}.
                    </p>
                  </div>
                </div>

                {errorDetails && (
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <h3 className="text-sm font-medium text-neutral-800 dark:text-white mb-2">
                      Error Details
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-white/60 font-mono">
                      {errorDetails}
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <h3 className="text-sm font-medium text-neutral-800 dark:text-white mb-2">
                    Possible reasons:
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-white/60 space-y-1">
                    <li>• The {resourceType} belongs to another user</li>
                    <li>• The {resourceType} ID may be incorrect</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-white/10">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-neutral-800 dark:text-white">
                  What would you like to do?
                </h2>

                <div className="grid gap-3">
                  {/* Go to Dashboard */}
                  <button
                    onClick={handleGoToDashboard}
                    className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="p-2 bg-gray-500/20 rounded-lg">
                      <Home className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-neutral-800 dark:text-white">
                        Go to Dashboard
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-white/60">
                        Return to your developer dashboard
                      </p>
                    </div>
                  </button>

                  {/* Contact Support */}
                  <button
                    onClick={handleContactSupport}
                    className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-neutral-800 dark:text-white">
                        Contact Support
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-white/60">
                        Get help with this access issue
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
