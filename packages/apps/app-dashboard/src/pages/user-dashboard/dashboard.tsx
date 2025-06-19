import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuthGuard } from '@/components/user-dashboard/auth/AuthGuard';
import { useUserSidebar } from '@/hooks/user-dashboard/useUserSidebar';
import { StatusMessage } from '@/utils/shared/statusMessage';
import { Card, CardContent } from '@/components/app-dashboard/ui/card';
import { Smartphone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import ConsentView from '@/components/user-dashboard/consent/Consent';
import ConnectWithVincent from '@/layout/shared/ConnectWithVincent';
import ProtectedByLit from '@/layout/shared/ProtectedByLit';

export default function UserDashboard() {
  const authGuardElement = useAuthGuard();
  const navigate = useNavigate();

  // Use shared sidebar data instead of loading independently
  const { apps, isLoading, appsError, authInfo, sessionSigs } = useUserSidebar();

  const currentTime = new Date().getHours();
  const greeting =
    currentTime < 12 ? 'Good morning' : currentTime < 17 ? 'Good afternoon' : 'Good evening';

  // Show loading if authenticating or loading data
  if (authGuardElement || isLoading) {
    return (
      <>
        <Helmet>
          <title>Vincent | Dashboard</title>
          <meta name="description" content="Your Vincent user dashboard" />
        </Helmet>
        <StatusMessage message="Loading dashboard..." type="info" />
      </>
    );
  }

  // Show consent view for authentication if not authenticated
  if (!authInfo?.userPKP || !authInfo?.agentPKP || !sessionSigs) {
    return (
      <>
        <Helmet>
          <title>Vincent | Dashboard</title>
          <meta name="description" content="Your Vincent user dashboard" />
        </Helmet>
        <div className="flex items-center justify-center p-8 min-h-screen">
          <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full border border-gray-100 overflow-hidden">
            <ConnectWithVincent signout={false} />
            <div className="p-6">
              <ConsentView isUserDashboardFlow={true} />
            </div>
            <ProtectedByLit />
          </div>
        </div>
      </>
    );
  }

  // Main dashboard content
  return (
    <>
      <Helmet>
        <title>Vincent | Dashboard</title>
        <meta name="description" content="Your Vincent user dashboard" />
      </Helmet>

      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Greeting */}
          <h1 className="text-4xl font-medium text-gray-900 text-center mb-12">{greeting}!</h1>

          {/* Welcome Message */}
          <div className="text-center mb-12">
            <p className="text-lg text-gray-600">
              Manage your connected applications and wallet activities
            </p>
          </div>

          {/* Error Message or Apps Card */}
          {appsError ? (
            <div className="text-center py-8">
              <p className="text-red-600">{appsError}</p>
            </div>
          ) : (
            <div className="space-y-4 mb-20">
              <h2 className="text-lg font-medium text-gray-900">Your Apps</h2>

              <Card
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigate('/user/apps')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Smartphone className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xl font-medium text-gray-900">My Applications</p>
                        <p className="text-gray-600">View and manage your connected apps</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-semibold text-gray-900">{apps.length}</p>
                      <p className="text-sm text-gray-500">
                        {apps.length === 1 ? 'app connected' : 'apps connected'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Footer Button */}
          <div className="flex justify-center pb-8">
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-gray-800"
              onClick={() => window.open('https://t.me/+vZWoA5k8jGoxZGEx', '_blank')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Help & Feedback
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
