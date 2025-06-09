import { Helmet } from 'react-helmet';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { useAuthGuard } from '@/components/user-dashboard/auth/AuthGuard';
import Loading from '@/layout/app-dashboard/Loading';
import { fetchUserApps } from '@/utils/user-dashboard/userAppsUtils';
import { AppDetails } from '@/types';
import { Card, CardContent } from '@/components/app-dashboard/ui/card';
import { Smartphone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import ConsentView from '@/components/user-dashboard/consent/Consent';
import ConnectWithVincent from '@/layout/shared/ConnectWithVincent';
import ProtectedByLit from '@/layout/shared/ProtectedByLit';

export default function UserDashboard() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();
  const navigate = useNavigate();

  // User apps state
  const [apps, setApps] = useState<AppDetails[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState<boolean>(true);

  // Load user apps
  useEffect(() => {
    let isMounted = true;

    async function loadApps() {
      if (!authInfo?.userPKP || !sessionSigs || !authInfo?.agentPKP) {
        setIsLoadingApps(false);
        return;
      }

      setIsLoadingApps(true);

      const result = await fetchUserApps({
        userPKP: authInfo.userPKP,
        sessionSigs,
        agentPKP: authInfo.agentPKP,
      });

      if (isMounted) {
        if (!result.error) {
          setApps(result.apps);
        }
        setIsLoadingApps(false);
      }
    }

    loadApps();

    return () => {
      isMounted = false;
    };
  }, [authInfo?.userPKP, sessionSigs, authInfo?.agentPKP]);

  const currentTime = new Date().getHours();
  const greeting =
    currentTime < 12 ? 'Good morning' : currentTime < 17 ? 'Good afternoon' : 'Good evening';

  // Show loading if authenticating or loading apps data
  if (
    authGuardElement ||
    (authInfo?.userPKP && authInfo?.agentPKP && sessionSigs && isLoadingApps)
  ) {
    return (
      <>
        <Helmet>
          <title>Vincent | Dashboard</title>
          <meta name="description" content="Your Vincent user dashboard" />
        </Helmet>
        <div className="flex min-h-screen items-center justify-center">
          <Loading />
        </div>
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

          {/* Apps Card */}
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
                      {apps.length === 1 ? 'app' : 'apps'} connected
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
