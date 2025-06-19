import { Helmet } from 'react-helmet-async';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

export default function ConnectWalletScreen() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) {
      navigate('/developer/dashboard');
    }
  }, [isConnected, navigate]);

  return (
    <>
      <Helmet>
        <title>Vincent | Developer Dashboard</title>
        <meta name="description" content="Connect your wallet to Vincent Developer Dashboard" />
      </Helmet>
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center p-5 font-sans relative pb-16">
        <main className="flex flex-col items-center flex-1 justify-center">
          <img
            src="/vincent-main-logo.png"
            alt="Vincent by Lit Protocol - Assistant for user owned automation"
            className="max-w-[400px] mb-5"
          />
          <h1 className="text-4xl font-medium text-gray-900 mb-4 mt-0">Developer Dashboard</h1>

          <div className="mb-2.5">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus || authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            className="bg-gray-900 text-white px-5 py-2.5 rounded-[20px] font-medium mx-2.5 inline-block border-none cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={openConnectModal}
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            className="bg-red-600 text-white px-5 py-2.5 rounded-[20px] font-medium mx-2.5 inline-block border-none cursor-pointer hover:bg-red-700 transition-colors"
                            onClick={openChainModal}
                          >
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <div className="flex gap-2.5 justify-center flex-wrap">
                          <button
                            className="bg-transparent text-gray-900 px-5 py-2.5 rounded-[20px] font-medium mx-2.5 inline-block border border-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={openChainModal}
                          >
                            {chain.name}
                          </button>
                          <button
                            className="bg-transparent text-gray-900 px-5 py-2.5 rounded-[20px] font-medium mx-2.5 inline-block border border-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={openAccountModal}
                          >
                            {account.displayName}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>

          <div className="mt-2.5 mb-[30px]">
            <a
              target="_blank"
              href="https://docs.heyvincent.ai/"
              className="text-gray-600 no-underline hover:text-gray-800 transition-colors"
              rel="noopener noreferrer"
              style={{ color: '#666', textDecoration: 'none' }}
            >
              Developer Docs
            </a>
          </div>

          {/* Protected by Lit */}
          <div className="mt-6 flex flex-col items-center mb-8">
            <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Protected by</div>
            <a
              href="https://www.litprotocol.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:opacity-70 transition-opacity duration-200"
            >
              <svg
                className="w-10 h-auto"
                width="40"
                viewBox="0 0 311 228"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Lit Protocol logo"
              >
                <path
                  d="M311 104.987V51.9125H256.038V29.2084L256.245 0.621826H202.816V174.264C202.816 181.242 204.193 188.153 206.866 194.599C209.54 201.045 213.459 206.9 218.398 211.83C223.337 216.76 229.2 220.667 235.652 223.328C242.103 225.989 249.016 227.352 255.994 227.338L311 227.25V175.045H269.794C267.969 175.047 266.162 174.689 264.477 173.992C262.791 173.295 261.259 172.272 259.969 170.982C258.679 169.692 257.656 168.16 256.959 166.474C256.262 164.789 255.904 162.982 255.906 161.157V140.517H256.053C256.053 128.723 256.053 116.929 256.053 104.943L311 104.987Z"
                  fill="black"
                />
                <path
                  d="M142.841 51.9125H184.564V0.621826H131.489V227.442H184.564V93.9711C184.564 88.7506 182.208 83.8089 178.151 80.5223L142.841 51.9125Z"
                  fill="black"
                />
                <path
                  d="M53.2347 161.157V0.621826H0.160156V174.264C0.160143 181.242 1.53637 188.153 4.21006 194.599C6.88376 201.045 10.8024 206.9 15.7418 211.83C20.6811 216.76 26.5442 220.667 32.9954 223.328C39.4466 225.989 46.3593 227.352 53.3379 227.338L113.12 227.25V175.045H67.1225C63.4392 175.045 59.9068 173.582 57.3023 170.978C54.6978 168.373 53.2347 164.841 53.2347 161.157Z"
                  fill="black"
                />
              </svg>
            </a>
          </div>
        </main>

        {/* Terms and Privacy - Fixed to bottom */}
        <footer className="absolute bottom-5 left-1/2 transform -translate-x-1/2 text-gray-400 text-xs">
          <a
            target="_blank"
            href="https://www.litprotocol.com/legal/terms-of-service"
            className="text-gray-400 no-underline mx-1 hover:text-gray-600 transition-colors"
            rel="noopener noreferrer"
            style={{ color: '#999', textDecoration: 'none' }}
          >
            Terms
          </a>
          <span className="mx-1">/</span>
          <a
            target="_blank"
            href="https://www.litprotocol.com/legal/privacy-policy"
            className="text-gray-400 no-underline mx-1 hover:text-gray-600 transition-colors"
            rel="noopener noreferrer"
            style={{ color: '#999', textDecoration: 'none' }}
          >
            Privacy
          </a>
        </footer>
      </div>
    </>
  );
}
