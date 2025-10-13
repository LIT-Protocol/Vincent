import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { ChevronRight, ImageIcon, X, WalletIcon, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

const faqData = [
  {
    question: 'How do I withdraw funds from Vincent?',
    answer: (
      <>
        <p>Watch this demonstration to learn how to withdraw funds from your Vincent wallet:</p>
        <div className="mt-3">
          <video controls className="w-full rounded-lg shadow-lg" preload="metadata">
            <source src="/videos/vincent-withdraw-instructions.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <p className={`mt-3 text-sm ${theme.textMuted}`}>
          The video demonstrates the complete withdrawal process using WalletConnect and your
          preferred dApp.
        </p>
      </>
    ),
  },
  {
    question: 'How do I connect my Vincent wallet to dApps?',
    answer: (setExpandedImage: (image: string | null) => void) => (
      <>
        <p>Vincent uses WalletConnect for secure access to dApps. Follow these steps:</p>
        <ol className="list-decimal list-inside ml-2 space-y-2">
          <li>Go to your wallet page and click 'Access Wallet'</li>
          <li>
            <div className="inline-flex items-start justify-between w-[calc(100%-1.5rem)]">
              <span>
                Visit your preferred dApp (we recommend Zerion or Uniswap for withdrawals)
              </span>
              <button
                onClick={() => setExpandedImage('/wc-instructions/zerion/zerion-1.png')}
                className={`ml-2 p-1 ${theme.itemHoverBg} rounded transition-colors flex-shrink-0`}
                aria-label="View Zerion screenshot"
              >
                <ImageIcon className="w-4 h-4" style={{ color: theme.brandOrange }} />
              </button>
            </div>
          </li>
          <li>
            <div className="inline-flex items-start justify-between w-[calc(100%-1.5rem)]">
              <span>Select WalletConnect as the connection method</span>
              <button
                onClick={() => setExpandedImage('/wc-instructions/zerion/zerion-2.png')}
                className={`ml-2 p-1 ${theme.itemHoverBg} rounded transition-colors flex-shrink-0`}
                aria-label="View WalletConnect selection screenshot"
              >
                <ImageIcon className="w-4 h-4" style={{ color: theme.brandOrange }} />
              </button>
            </div>
          </li>
          <li>
            <div className="inline-flex items-start justify-between w-[calc(100%-1.5rem)]">
              <span>Copy the connection URI or scan the QR code from the Vincent page</span>
              <button
                onClick={() => setExpandedImage('/wc-instructions/zerion/zerion-3.png')}
                className={`ml-2 p-1 ${theme.itemHoverBg} rounded transition-colors flex-shrink-0`}
                aria-label="View connection screenshot"
              >
                <ImageIcon className="w-4 h-4" style={{ color: theme.brandOrange }} />
              </button>
            </div>
          </li>
          <li>
            <div className="inline-flex items-start justify-between w-[calc(100%-1.5rem)]">
              <span>Approve the connection on the Vincent dashboard</span>
              <button
                onClick={() => setExpandedImage('/wc-instructions/zerion/zerion-4.png')}
                className={`ml-2 p-1 ${theme.itemHoverBg} rounded transition-colors flex-shrink-0`}
                aria-label="View approval screenshot"
              >
                <ImageIcon className="w-4 h-4" style={{ color: theme.brandOrange }} />
              </button>
            </div>
          </li>
        </ol>
        <p className="mt-3">
          Once connected, you can manage your funds, swap tokens, and interact with DeFi protocols
          using your Vincent wallet.
        </p>
      </>
    ),
  },
  {
    question: 'How can I verify my Vincent Wallet on Galxe?',
    answer: (
      <>
        <p>You can verify on Galxe by connecting through our WalletConnect integration:</p>
        <ol className="list-decimal list-inside ml-2 space-y-1">
          <li>
            Go to{' '}
            <span style={{ color: theme.brandOrange }}>dashboard.heyvincent.ai/user/apps</span>
          </li>
          <li>Click the 'Access Wallet' button</li>
          <li>Follow the WalletConnect instructions and connect your wallet to Galxe</li>
        </ol>
      </>
    ),
  },
  {
    question: 'Why am I having trouble withdrawing?',
    answer: (
      <>
        <p>
          Vincent uses WalletConnect for withdrawals and wallet management. Connection issues can
          occasionally occur due to WalletConnect session timeouts or network problems.
        </p>
        <p>Try the following:</p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li>Refresh your browser</li>
          <li>Clear your cache</li>
          <li>Reconnect your wallet</li>
        </ul>
        <p>
          If problems persist across multiple attempts, please use the "Help" button below for
          assistance.
        </p>
      </>
    ),
  },
  {
    question: 'What does INSUFFICIENT_FUNDS mean?',
    answer: (
      <>
        <p>This error means you don't have enough native tokens to cover gas fees.</p>
        <p>
          For Vincent Yield, you need ETH on Base Mainnet. For other applications, check their
          documentation for the required network and token.
        </p>
        <p className={`text-sm ${theme.accentBg} p-2 rounded`}>
          <strong>Remember:</strong> Each blockchain transaction requires a small amount of the
          native token (ETH, MATIC, etc.) for gas fees. Some transactions require more than others.
        </p>
      </>
    ),
  },
  {
    question: 'Are my funds safe if I encounter a withdrawal error?',
    answer: (
      <>
        <p>
          Yes, absolutely. Your funds are secured by Lit Protocol's Programmable Key Pairs (PKPs)
          and tied to your authentication credentials.
        </p>
        <p>
          Technical issues with withdrawals don't affect the security of your assets. If you
          experience any issues, please remain calm and contact our support team who will help
          resolve the problem.
        </p>
      </>
    ),
  },
  {
    question: "What if I don't see my issue here?",
    answer: (setExpandedImage: (image: string | null) => void) => (
      <>
        <p>If you can't find the answer to your question in this FAQ, we're here to help!</p>
        <p className="mb-3">Look for the Help button in the bottom-right corner of your screen:</p>
        <div className="mb-4">
          <button
            onClick={() => setExpandedImage('/help/help-button-location.png')}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img
              src="/help/help-button-location.png"
              alt="Help button location"
              className="rounded-lg shadow-md max-w-full"
            />
          </button>
          <p className={`text-xs ${theme.textMuted} mt-2`}>Click image to enlarge</p>
        </div>
      </>
    ),
  },
];

interface FAQItemProps {
  question: string;
  answer: React.ReactNode | ((setExpandedImage: (image: string | null) => void) => React.ReactNode);
  isOpen: boolean;
  onToggle: () => void;
  setExpandedImage?: (image: string | null) => void;
}

function FAQItem({ question, answer, isOpen, onToggle, setExpandedImage }: FAQItemProps) {
  const answerContent =
    typeof answer === 'function' && setExpandedImage ? answer(setExpandedImage) : answer;
  const panelId = `faq-panel-${question.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={`border-b ${theme.cardBorder} last:border-0`}>
      <button
        onClick={onToggle}
        className={`w-full py-4 px-2 flex items-center justify-between text-left ${theme.itemHoverBg} transition-colors`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        style={fonts.heading}
      >
        <span className={`font-medium ${theme.text}`}>{question}</span>
        <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className={`w-5 h-5 ${theme.textMuted}`} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
            role="region"
            aria-labelledby={`button-${panelId}`}
          >
            <div className={`px-2 pb-4 ${theme.textMuted} space-y-2`} style={fonts.body}>
              {answerContent as React.ReactNode}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const toggleItem = (index: number) => {
    setOpenItems((prevItems) => {
      const newOpenItems = new Set(prevItems);
      if (newOpenItems.has(index)) {
        newOpenItems.delete(index);
      } else {
        newOpenItems.add(index);
      }
      return newOpenItems;
    });
  };

  return (
    <>
      <Helmet>
        <title>FAQ - Vincent Dashboard</title>
      </Helmet>

      <div className="container mx-auto px-4 pt-8 pb-8 max-w-4xl relative z-10">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 ${theme.textMuted} hover:${theme.text} transition-colors`}
            style={fonts.heading}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl" style={fonts.heading}>
              Frequently Asked Questions
            </CardTitle>
            <p className={`${theme.textMuted} mt-2`} style={fonts.body}>
              Find answers to common questions about using Vincent
            </p>
          </CardHeader>
          <CardContent>
            <div className={`divide-y ${theme.cardBorder}`}>
              {faqData.map((item, index) => (
                <FAQItem
                  key={index}
                  question={item.question}
                  answer={item.answer}
                  isOpen={openItems.has(index)}
                  onToggle={() => toggleItem(index)}
                  setExpandedImage={setExpandedImage}
                />
              ))}
            </div>
            <div className={`mt-8 pt-6 border-t ${theme.cardBorder}`}>
              <div className="text-center">
                <p className={`${theme.textMuted} mb-4`} style={fonts.body}>
                  Ready to manage your Vincent apps?
                </p>
                <Button
                  onClick={() => navigate('/user/apps')}
                  className="text-white"
                  style={{ ...fonts.heading, backgroundColor: theme.brandOrange }}
                >
                  <WalletIcon className="w-4 h-4 mr-2" />
                  Go to My Apps
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
            onClick={() => setExpandedImage(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setExpandedImage(null);
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Expanded image view"
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
    </>
  );
}
