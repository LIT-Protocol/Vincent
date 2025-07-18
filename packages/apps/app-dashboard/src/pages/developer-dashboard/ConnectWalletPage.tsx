import { Helmet } from 'react-helmet-async';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import ProtectedByLit from '@/components/shared/ui/ProtectedByLit';
import Footer from '@/components/shared/ui/Footer';

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
      <div className="fixed inset-0 flex flex-col justify-center items-center bg-white text-center font-sans">
        <div className="flex flex-col items-center max-w-lg mx-auto px-4">
          <img
            src="/vincent-main-logo.png"
            alt="Vincent by Lit Protocol - Assistant for user owned automation"
            className="max-w-[400px] w-full mb-8"
          />
          <h1 className="text-4xl font-medium text-gray-900 mb-8">Developer Dashboard</h1>

          <div className="mb-6">
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
                            className="bg-gray-900 text-white px-6 py-3 rounded-[20px] font-medium border-none cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={openConnectModal}
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            className="bg-red-600 text-white px-6 py-3 rounded-[20px] font-medium border-none cursor-pointer hover:bg-red-700 transition-colors"
                            onClick={openChainModal}
                          >
                            Unsupported network
                          </button>
                        );
                      }

                      return (
                        <div className="flex gap-3 justify-center flex-wrap">
                          <button
                            className="bg-transparent text-gray-900 px-5 py-2.5 rounded-[20px] font-medium border border-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={openChainModal}
                          >
                            {chain.name}
                          </button>
                          <button
                            className="bg-transparent text-gray-900 px-5 py-2.5 rounded-[20px] font-medium border border-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
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

          <div className="mb-8">
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

          <div className="w-full max-w-md">
            <ProtectedByLit />
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
