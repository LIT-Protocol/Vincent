import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, ArrowRight } from 'lucide-react';
import { Footer } from '../../components/shared/Footer';

export function ExplorerLandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Vincent | Explorer</title>
        <meta name="description" content="Discover and explore applications built on Vincent" />
      </Helmet>

      <div className="flex flex-col min-h-screen bg-white text-center p-3 sm:p-5 font-sans relative">
        <main className="flex flex-col items-center flex-1 justify-center">
          {/* Explorer Icon */}
          <div className="relative mb-6 sm:mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100">
              <Compass className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500" />
            </div>
            <div className="absolute -bottom-2 -right-2">
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-3 sm:mb-4">
            Explore Vincent
          </h1>

          <p className="text-gray-600 mb-8 sm:mb-10 max-w-lg text-base sm:text-lg px-2 leading-relaxed">
            Browse what's available in the Vincent ecosystem.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl px-2">
            <button
              onClick={() => navigate('/explorer/apps')}
              className="bg-white border border-gray-200 rounded-xl p-6 text-left hover:border-orange-200 hover:bg-orange-50 transition-colors group"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
                <Search className="w-4 h-4 text-gray-600 group-hover:text-orange-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Apps</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Browse applications built on Vincent that are ready to use.
              </p>
              <div className="flex items-center text-sm text-gray-500 group-hover:text-orange-600 transition-colors">
                For Users <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </button>

            <div className="relative bg-gray-100 border border-gray-200 rounded-xl p-6 text-left opacity-60 cursor-not-allowed">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                <Compass className="w-4 h-4 text-gray-500" />
              </div>
              <h3 className="font-semibold text-gray-600 mb-2 text-lg">Abilities</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Discover reusable abilities to build into your applications.
              </p>
              <div className="flex items-center text-sm text-gray-500">
                For Developers <ArrowRight className="w-3 h-3 ml-1" />
              </div>
              <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
                Coming Soon
              </div>
            </div>

            <div className="relative bg-gray-100 border border-gray-200 rounded-xl p-6 text-left opacity-60 cursor-not-allowed">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-600 mb-2 text-lg">Policies</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Find access control policies to secure your applications.
              </p>
              <div className="flex items-center text-sm text-gray-500">
                For Developers <ArrowRight className="w-3 h-3 ml-1" />
              </div>
              <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
                Coming Soon
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-10">
            <button
              onClick={() => navigate('/')}
              className="bg-transparent text-gray-600 px-6 py-2 rounded-[20px] font-medium border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
            >
              Back to Home
            </button>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
