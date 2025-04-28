import { useConnect } from 'wagmi';
import { Button } from '@/components/ui/button';

interface WalletMethodsProps {
  authWithEthWallet: (connector: any) => Promise<void>;
  setView: React.Dispatch<React.SetStateAction<string>>;
}

const WalletMethods = ({ authWithEthWallet, setView }: WalletMethodsProps) => {
  const { connectors } = useConnect();

  return (
    <>
      <h1 className="text-xl font-semibold text-center text-gray-800 mb-2">Connect your wallet</h1>
      <p className="text-sm text-gray-600 text-center mb-6">
        Connect your wallet and sign a message to verify ownership
      </p>

      <div className="space-y-3">
        {connectors.map(connector => (
          <Button
            key={connector.id}
            className="w-full bg-white text-gray-700 border border-gray-200 rounded-lg py-3 px-4 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={!connector.ready}
            onClick={() => authWithEthWallet({ connector })}
          >
            {connector.name.toLowerCase() === 'metamask' && (
              <div className="w-5 h-5 relative mr-2">
                <img
                  src="/metamask.png"
                  alt="MetaMask logo"
                />
              </div>
            )}
            {connector.name.toLowerCase() === 'coinbase wallet' && (
              <div className="w-5 h-5 relative mr-2">
                <img
                  src="/coinbase.png"
                  alt="Coinbase logo"
                />
              </div>
            )}
            <span>Continue with {connector.name}</span>
          </Button>
        ))}

        <div className="mt-6">
          <Button
            onClick={() => setView('default')}
            className="w-full bg-white text-gray-700 border border-gray-200 rounded-lg py-3 px-4 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Back
          </Button>
        </div>
      </div>
    </>
  );
};

export default WalletMethods;
