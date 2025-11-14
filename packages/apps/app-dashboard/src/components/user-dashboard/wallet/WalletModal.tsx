import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/shared/ui/button';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { ImageIcon, X } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewType = 'main' | 'zerion' | 'uniswap';

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const renderMainView = () => (
    <>
      {/* Header */}
      <div className={`px-4 sm:px-6 py-4 border-b ${theme.cardBorder}`}>
        <h2 className={`text-lg font-bold ${theme.text} text-center mb-2`} style={fonts.heading}>
          Connect to dApps
        </h2>
        <p className={`text-sm ${theme.textMuted} text-center`} style={fonts.body}>
          Vincent uses WalletConnect for secure access to dApps. To{' '}
          <span className="font-medium" style={{ color: theme.brandOrange }}>
            withdraw funds
          </span>
          , please connect to one of the dApps below. You can also use any other app of your
          choosing.
        </p>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Verified Apps */}
        <div className="space-y-3">
          <h3
            className={`text-sm font-semibold ${theme.text} uppercase tracking-wider`}
            style={fonts.heading}
          >
            Verified Apps
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {/* Zerion Card */}
            <div
              className={`p-3 rounded-lg border ${theme.cardBorder} ${theme.mainCard} hover:${theme.itemHoverBg} transition-all duration-200 cursor-pointer group`}
              onClick={() => setCurrentView('zerion')}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${theme.itemBg} flex-shrink-0`}>
                  <img
                    src="/external-logos/icons/zerion-icon.svg"
                    alt="Zerion"
                    className="w-6 h-6"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={`font-semibold text-sm ${theme.text}`} style={fonts.heading}>
                      Zerion
                    </h4>
                    <span
                      className="px-2 py-0.5 text-[10px] font-medium rounded-full border"
                      style={{
                        backgroundColor: 'rgba(255, 66, 5, 0.1)',
                        color: theme.brandOrange,
                        borderColor: 'rgba(255, 66, 5, 0.2)',
                      }}
                    >
                      Recommended
                    </span>
                  </div>
                  <p className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                    Portfolio management and DeFi interface
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 ${theme.textMuted} group-hover:translate-x-0.5 transition-transform flex-shrink-0`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            {/* Uniswap Card */}
            <div
              className={`p-3 rounded-lg border ${theme.cardBorder} ${theme.mainCard} hover:${theme.itemHoverBg} transition-all duration-200 cursor-pointer group`}
              onClick={() => setCurrentView('uniswap')}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${theme.itemBg} flex-shrink-0`}>
                  <img
                    src="/external-logos/icons/uniswap-logo.svg"
                    alt="Uniswap"
                    className="w-6 h-6"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={`font-semibold ${theme.text} text-sm`} style={fonts.heading}>
                      Uniswap
                    </h4>
                    <span
                      className="px-2 py-0.5 text-[10px] font-medium rounded-full border"
                      style={{
                        backgroundColor: 'rgba(255, 66, 5, 0.1)',
                        color: theme.brandOrange,
                        borderColor: 'rgba(255, 66, 5, 0.2)',
                      }}
                    >
                      Recommended
                    </span>
                  </div>
                  <p className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                    Decentralized token exchange
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 ${theme.textMuted} group-hover:translate-x-0.5 transition-transform flex-shrink-0`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Other Connections */}
        <div className="space-y-3">
          <h3
            className={`text-sm font-semibold ${theme.text} uppercase tracking-wider`}
            style={fonts.heading}
          >
            Other Connections
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <div
              className={`p-3 rounded-lg border ${theme.cardBorder} ${theme.mainCard} hover:${theme.itemHoverBg} transition-all duration-200 cursor-pointer group`}
              onClick={onClose}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border"
                  style={{
                    backgroundColor: 'rgba(255, 66, 5, 0.1)',
                    borderColor: 'rgba(255, 66, 5, 0.2)',
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    style={{ color: theme.brandOrange }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-semibold ${theme.text} text-sm mb-0.5`}
                    style={fonts.heading}
                  >
                    Connect to any dApp
                  </h4>
                  <p className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                    Use WalletConnect with any supported dApp
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 ${theme.textMuted} group-hover:translate-x-0.5 transition-transform flex-shrink-0`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderZerionView = () => (
    <>
      {/* Header */}
      <div className={`px-4 sm:px-6 py-4 border-b ${theme.cardBorder}`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView('main')}
            className={`p-1.5 rounded-md hover:${theme.itemHoverBg} transition-colors`}
          >
            <svg
              className={`w-5 h-5 ${theme.text}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex items-center space-x-2.5">
            <div className={`p-1.5 rounded-lg ${theme.itemBg}`}>
              <img src="/external-logos/icons/zerion-icon.svg" alt="Zerion" className="w-5 h-5" />
            </div>
            <h2 className={`text-lg font-bold ${theme.text}`} style={fonts.heading}>
              Connect to Zerion
            </h2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-4 space-y-4">
        <div className="space-y-4">
          <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
            Follow these steps to connect your Vincent wallet to Zerion:
          </p>

          <div className="space-y-3">
            <div className="flex gap-3">
              <span
                className="text-sm font-bold flex-shrink-0 w-5"
                style={{ ...fonts.heading, color: theme.brandOrange }}
              >
                1.
              </span>
              <p className={`text-sm ${theme.text}`} style={fonts.body}>
                Visit{' '}
                <a
                  href="https://app.zerion.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80 transition-opacity font-medium"
                  style={{ color: theme.brandOrange }}
                >
                  app.zerion.io
                </a>{' '}
                in your browser
              </p>
            </div>

            <div className="flex gap-3">
              <span
                className="text-sm font-bold flex-shrink-0 w-5"
                style={{ ...fonts.heading, color: theme.brandOrange }}
              >
                2.
              </span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${theme.text} flex-1`} style={fonts.body}>
                    Under "Connect to Zerion" &gt; "Ethereum", click "WalletConnect"
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/zerion/zerion-1.png')}
                    className={`p-1.5 hover:${theme.itemHoverBg} rounded-md transition-colors flex-shrink-0`}
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4" style={{ color: theme.brandOrange }} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <span
                className="text-sm font-bold flex-shrink-0 w-5"
                style={{ ...fonts.heading, color: theme.brandOrange }}
              >
                3.
              </span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${theme.text} flex-1`} style={fonts.body}>
                    Copy the connection URI or scan the QR code from the Vincent page
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/zerion/zerion-2.png')}
                    className={`p-1.5 hover:${theme.itemHoverBg} rounded-md transition-colors flex-shrink-0`}
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4" style={{ color: theme.brandOrange }} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <span
                className="text-sm font-bold flex-shrink-0 w-5"
                style={{ ...fonts.heading, color: theme.brandOrange }}
              >
                4.
              </span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${theme.text} flex-1`} style={fonts.body}>
                    Approve the connection on the Vincent dashboard
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/zerion/zerion-3.png')}
                    className={`p-1.5 hover:${theme.itemHoverBg} rounded-md transition-colors flex-shrink-0`}
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4" style={{ color: theme.brandOrange }} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <span
                className="text-sm font-bold flex-shrink-0 w-5"
                style={{ ...fonts.heading, color: theme.brandOrange }}
              >
                5.
              </span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${theme.text} flex-1`} style={fonts.body}>
                    You're connected! You can now use Zerion to manage your Vincent Wallet.
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/zerion/zerion-4.png')}
                    className={`p-1.5 hover:${theme.itemHoverBg} rounded-md transition-colors flex-shrink-0`}
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4" style={{ color: theme.brandOrange }} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            className="p-3 rounded-lg"
            style={{
              backgroundColor: 'rgba(255, 66, 5, 0.05)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(255, 66, 5, 0.2)',
            }}
          >
            <p className={`text-xs ${theme.text}`} style={fonts.body}>
              <span className="font-semibold" style={{ color: theme.brandOrange }}>
                Tip:
              </span>{' '}
              Once connected, you'll be able to view your portfolio, manage assets, and interact
              with DeFi protocols directly through Zerion using your Vincent wallet.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-4 sm:px-6 py-4 border-t ${theme.cardBorder} flex justify-center`}>
        <Button
          onClick={onClose}
          className="px-8 py-2 text-white font-medium transition-opacity hover:opacity-90"
          style={{ ...fonts.heading, backgroundColor: theme.brandOrange }}
        >
          Start Connection
        </Button>
      </div>
    </>
  );

  const renderUniswapView = () => (
    <>
      {/* Header */}
      <div className={`px-4 sm:px-6 py-4 border-b ${theme.cardBorder}`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView('main')}
            className={`p-1.5 rounded-md hover:${theme.itemHoverBg} transition-colors`}
          >
            <svg
              className={`w-5 h-5 ${theme.text}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex items-center space-x-2.5">
            <div className={`p-1.5 rounded-lg ${theme.itemBg}`}>
              <img src="/external-logos/icons/uniswap-logo.svg" alt="Uniswap" className="w-5 h-5" />
            </div>
            <h2 className={`text-lg font-bold ${theme.text}`} style={fonts.heading}>
              Connect to Uniswap
            </h2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-4 space-y-4">
        <div className="space-y-4">
          <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
            Follow these steps to connect your Vincent wallet to Uniswap:
          </p>

          <div className="space-y-3">
            <div className="flex gap-3">
              <span
                className="text-sm font-bold flex-shrink-0 w-5"
                style={{ ...fonts.heading, color: theme.brandOrange }}
              >
                1.
              </span>
              <p className={`text-sm ${theme.text}`} style={fonts.body}>
                Visit{' '}
                <a
                  href="https://app.uniswap.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80 transition-opacity font-medium"
                  style={{ color: theme.brandOrange }}
                >
                  app.uniswap.org
                </a>{' '}
                in your browser
              </p>
            </div>

            <div className="flex gap-3">
              <span
                className="text-sm font-bold flex-shrink-0 w-5"
                style={{ ...fonts.heading, color: theme.brandOrange }}
              >
                2.
              </span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${theme.text} flex-1`} style={fonts.body}>
                    Click "Connect" in the top right and select "WalletConnect"
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/uniswap/uniswap-1.png')}
                    className={`p-1.5 hover:${theme.itemHoverBg} rounded-md transition-colors flex-shrink-0`}
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4" style={{ color: theme.brandOrange }} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <span
                className="text-sm font-bold flex-shrink-0 w-5"
                style={{ ...fonts.heading, color: theme.brandOrange }}
              >
                3.
              </span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${theme.text} flex-1`} style={fonts.body}>
                    Copy the connection URI or scan the QR code from the Vincent page
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/uniswap/uniswap-2.png')}
                    className={`p-1.5 hover:${theme.itemHoverBg} rounded-md transition-colors flex-shrink-0`}
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4" style={{ color: theme.brandOrange }} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <span
                className="text-sm font-bold flex-shrink-0 w-5"
                style={{ ...fonts.heading, color: theme.brandOrange }}
              >
                4.
              </span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${theme.text} flex-1`} style={fonts.body}>
                    Approve the connection on the Vincent dashboard
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/uniswap/uniswap-3.png')}
                    className={`p-1.5 hover:${theme.itemHoverBg} rounded-md transition-colors flex-shrink-0`}
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4" style={{ color: theme.brandOrange }} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <span
                className="text-sm font-bold flex-shrink-0 w-5"
                style={{ ...fonts.heading, color: theme.brandOrange }}
              >
                5.
              </span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${theme.text} flex-1`} style={fonts.body}>
                    You're connected! You can now trade on Uniswap with your Vincent Wallet.
                  </p>
                  <button
                    onClick={() => setExpandedImage('/wc-instructions/uniswap/uniswap-4.png')}
                    className={`p-1.5 hover:${theme.itemHoverBg} rounded-md transition-colors flex-shrink-0`}
                    aria-label="View screenshot"
                  >
                    <ImageIcon className="w-4 h-4" style={{ color: theme.brandOrange }} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            className="p-3 rounded-lg"
            style={{
              backgroundColor: 'rgba(255, 66, 5, 0.05)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(255, 66, 5, 0.2)',
            }}
          >
            <p className={`text-xs ${theme.text}`} style={fonts.body}>
              <span className="font-semibold" style={{ color: theme.brandOrange }}>
                Tip:
              </span>{' '}
              Once connected, you'll be able to swap tokens, provide liquidity, and access all
              Uniswap features using your Vincent wallet.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-4 sm:px-6 py-4 border-t ${theme.cardBorder} flex justify-center`}>
        <Button
          onClick={onClose}
          className="px-8 py-2 text-white font-medium transition-opacity hover:opacity-90"
          style={{ ...fonts.heading, backgroundColor: theme.brandOrange }}
        >
          Start Connection
        </Button>
      </div>
    </>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'zerion':
        return renderZerionView();
      case 'uniswap':
        return renderUniswapView();
      default:
        return renderMainView();
    }
  };

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-[100]"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              className="fixed inset-0 flex items-center justify-center p-4 z-[100] pointer-events-none md:pl-64"
            >
              <div
                className={`w-full max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden pointer-events-auto`}
                onClick={(e) => e.stopPropagation()}
              >
                {renderCurrentView()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
            onClick={() => setExpandedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-[95vw] max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setExpandedImage(null)}
                className="absolute top-4 right-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors z-10"
                aria-label="Close image"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <img src={expandedImage} alt="Screenshot" className="rounded-lg shadow-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
};
