import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { ConsentFooter } from '@/components/user-dashboard/ui/Footer';

export default function RootPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Vincent | Delegation Platform</title>
        <meta
          name="description"
          content="Vincent - Delegation Platform for user owned automation powered by Lit Protocol"
        />
      </Helmet>
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center p-3 sm:p-5 font-sans relative pb-12 sm:pb-16">
        <main className="flex flex-col items-center flex-1 justify-center">
          <img
            src="/vincent-main-logo.png"
            alt="Vincent by Lit Protocol - Delegation Platform for user owned automation"
            className="max-w-[280px] sm:max-w-[400px] mb-3 sm:mb-5"
          />
          <p className="text-gray-600 mb-6 sm:mb-8 max-w-md text-sm sm:text-base px-2">
            A permission delegation platform for automation.
            <br />
            Choose your path to get started.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
            <button
              onClick={() => navigate('/developer/dashboard')}
              className="bg-gray-900 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-[20px] font-medium hover:bg-gray-800 transition-colors min-w-[140px] sm:min-w-[160px] text-sm sm:text-base"
            >
              Build
            </button>
            <button
              onClick={() => navigate('/user/apps')}
              className="bg-transparent text-gray-900 px-5 sm:px-6 py-2.5 sm:py-3 rounded-[20px] font-medium border border-gray-900 hover:bg-gray-100 transition-colors min-w-[140px] sm:min-w-[160px] text-sm sm:text-base"
            >
              Earn
            </button>
          </div>

          <div className="text-center space-y-3 sm:space-y-4 px-2">
            <p className="text-gray-500 text-xs sm:text-sm">
              <strong>Build:</strong> Create and manage applications, tools, and policies with
              delegated permissions
            </p>
            <p className="text-gray-500 text-xs sm:text-sm">
              <strong>Earn:</strong> Control and delegate permissions to your applications
            </p>
          </div>
        </main>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0">
          <ConsentFooter />
        </div>
      </div>
    </>
  );
}
