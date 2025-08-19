import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, ArrowRight } from 'lucide-react';

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

        {/* Footer */}
        <div className="px-3 sm:px-6 py-2 flex flex-col items-center gap-2 mt-auto">
          <div className="flex items-center gap-2 text-sm font-normal text-gray-500">
            <span>Powered by</span>
            <a
              href="https://litprotocol.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-normal no-underline !text-orange-500 hover:!text-orange-600 transition-colors"
              style={{ textDecoration: 'none', fontWeight: 'normal', fontStyle: 'normal' }}
            >
              <svg
                className="w-5 h-auto"
                width="40"
                viewBox="0 0 311 228"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Lit Protocol logo"
              >
                <path
                  d="M311 104.987V51.9125H256.038V29.2084L256.245 0.621826H202.816V174.264C202.816 181.242 204.193 188.153 206.866 194.599C209.54 201.045 213.459 206.9 218.398 211.83C223.337 216.76 229.2 220.667 235.652 223.328C242.103 225.989 249.016 227.352 255.994 227.338L311 227.25V175.045H269.794C267.969 175.047 266.162 174.689 264.477 173.992C262.791 173.295 261.259 172.272 259.969 170.982C258.679 169.692 257.656 168.16 256.959 166.474C256.262 164.789 255.904 162.982 255.906 161.157V140.517H256.053C256.053 128.723 256.053 116.929 256.053 104.943L311 104.987Z"
                  fill="currentColor"
                />
                <path
                  d="M142.841 51.9125H184.564V0.621826H131.489V227.442H184.564V93.9711C184.564 88.7506 182.208 83.8089 178.151 80.5223L142.841 51.9125Z"
                  fill="currentColor"
                />
                <path
                  d="M53.2347 161.157V0.621826H0.160156V174.264C0.160143 181.242 1.53637 188.153 4.21006 194.599C6.88376 201.045 10.8024 206.9 15.7418 211.83C20.6811 216.76 26.5442 220.667 32.9954 223.328C39.4466 225.989 46.3593 227.352 53.3379 227.338L113.12 227.25V175.045H67.1225C63.4392 175.045 59.9068 173.582 57.3023 170.978C54.6978 168.373 53.2347 164.841 53.2347 161.157Z"
                  fill="currentColor"
                />
              </svg>
            </a>
          </div>
          <div className="flex items-center gap-1 text-sm font-normal text-gray-500">
            <a
              href="https://t.me/+aa73FAF9Vp82ZjJh"
              target="_blank"
              rel="noopener noreferrer"
              className="font-normal no-underline hover:opacity-80 transition-colors !text-gray-500"
              style={{ textDecoration: 'none', fontWeight: 'normal', fontStyle: 'normal' }}
            >
              Help
            </a>
            <span className="font-normal text-gray-500"> / </span>
            <a
              href="https://www.litprotocol.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-normal no-underline hover:opacity-80 transition-colors !text-gray-500"
              style={{ textDecoration: 'none', fontWeight: 'normal', fontStyle: 'normal' }}
            >
              Privacy
            </a>
            <span className="font-normal text-gray-500"> / </span>
            <a
              href="https://www.litprotocol.com/legal/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="font-normal no-underline hover:opacity-80 transition-colors !text-gray-500"
              style={{ textDecoration: 'none', fontWeight: 'normal', fontStyle: 'normal' }}
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
