import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import LandingPartners from '../../components/shared/LandingPartners';

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

        {/* Footer */}
        <div className="px-3 sm:px-6 py-2 flex flex-col items-center gap-2 mt-auto">
          <div className="flex items-center gap-2 text-sm font-normal text-gray-500">
            <a
              href="https://litprotocol.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold no-underline !text-orange-500 hover:!text-orange-600 transition-colors"
              style={{ textDecoration: 'none', fontWeight: '600', fontStyle: 'normal' }}
            >
              <svg
                className="w-4 h-auto"
                width="40"
                viewBox="0 0 311 228"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Lit Protocol logo"
                style={{ marginTop: '-2px' }}
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
                  d="M53.2347 161.157V0.621826H0.160156V174.264C0.160143 181.242 1.53637 188.153 4.21006 194.599C6.88376 201.045 10.8024 206.9 15.7418 211.83C20.6811 216.760 26.5442 220.667 32.9954 223.328C39.4466 225.989 46.3593 227.352 53.3379 227.338L113.12 227.25V175.045H67.1225C63.4392 175.045 59.9068 173.582 57.3023 170.978C54.6978 168.373 53.2347 164.841 53.2347 161.157Z"
                  fill="currentColor"
                />
              </svg>
              <span>Securing Autonomy</span>
            </a>
          </div>
          <div className="flex items-center gap-1 text-sm font-normal text-black">
            <a
              href="https://t.me/+aa73FAF9Vp82ZjJh"
              target="_blank"
              rel="noopener noreferrer"
              className="font-normal no-underline hover:opacity-80 transition-colors !text-black"
              style={{ textDecoration: 'none', fontWeight: 'normal', fontStyle: 'normal' }}
            >
              Support
            </a>
            <span className="font-normal text-black"> / </span>
            <a
              href="https://www.litprotocol.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-normal no-underline hover:opacity-80 transition-colors !text-black"
              style={{ textDecoration: 'none', fontWeight: 'normal', fontStyle: 'normal' }}
            >
              Privacy
            </a>
            <span className="font-normal text-black"> / </span>
            <a
              href="https://www.litprotocol.com/legal/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="font-normal no-underline hover:opacity-80 transition-colors !text-black"
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
