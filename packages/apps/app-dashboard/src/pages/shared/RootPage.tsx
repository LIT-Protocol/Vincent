import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import LandingPartners from '../../components/shared/LandingPartners';
import { Footer } from '../../components/shared/Footer';

export default function RootPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Vincent | Delegation Platform</title>
        <meta
          name="description"
          content="Vincent - Delegation Platform for user owned automation secured by Lit Protocol"
        />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-white text-center p-3 sm:p-5 font-sans relative overflow-x-hidden">
        <main className="flex flex-col items-center flex-1 justify-center pt-16 sm:pt-20">
          <img
            src="/vincent-main-logo.png"
            alt="Vincent by Lit Protocol - Delegation Platform for user owned automation"
            className="max-w-[320px] sm:max-w-[400px] mb-3 sm:mb-5"
            width="400"
            height="107"
            style={{ aspectRatio: '2051/549', maxWidth: '100%', height: 'auto' }}
            loading="eager"
            decoding="sync"
            fetchPriority="high"
          />
          <p className="text-gray-600 mb-6 sm:mb-8 max-w-md text-base sm:text-lg px-2">
            The portal for intelligent finance.
          </p>

          <div className="flex flex-col items-center gap-4 mb-4 sm:mb-8 max-w-sm mx-auto">
            {/* Top button - Earn */}
            <button
              onClick={() => navigate('/user/apps')}
              className="bg-orange-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-orange-600 transition-colors text-base min-w-28"
            >
              Earn
            </button>

            {/* Bottom row - Build and Explore */}
            <div className="flex gap-8">
              <button
                onClick={() => navigate('/developer/dashboard')}
                className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold border border-gray-900 hover:bg-gray-100 transition-colors text-base min-w-28"
              >
                Build
              </button>
              <button
                onClick={() => navigate('/explorer')}
                className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold border border-gray-900 hover:bg-gray-100 transition-colors text-base min-w-28"
              >
                Explore
              </button>
            </div>
          </div>

          <LandingPartners />
        </main>
        <Footer />
      </div>
    </>
  );
}
