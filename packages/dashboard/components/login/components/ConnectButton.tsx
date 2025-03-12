import { useEffect, useState } from 'react';
import AuthModal from './AuthModal';
import useSession from '../hooks/useSession';
import useAccounts from '../hooks/useAccounts';
import '../styles/lit-login-modal.css';
import "../styles/layout.css";
import { useDisconnect } from 'wagmi';
import { useSessionStorage } from '../hooks/useSessionStorage';

export default function ConnectButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { clearSession: clearLitSession } = useSession();
  const { currentAccount, setCurrentAccount } = useAccounts('login');
  const { sessionData, clearSession } = useSessionStorage();

  const { disconnectAsync } = useDisconnect();

  useEffect(() => {
    // When currentAccount changes, ensure modals are closed
    if (currentAccount) {
      setIsModalOpen(false);
      setIsLogoutModalOpen(false);
    }
  }, [currentAccount]);

  const handleButtonClick = () => {
    if (currentAccount) {
      // If logged in, show logout modal
      setIsLogoutModalOpen(true);
    } else {
      // If not logged in, show auth modal
      setIsModalOpen(true);
    }
  };

  const handleLogout = async () => {
    clearLitSession();
    clearSession();
    await disconnectAsync();
    setCurrentAccount(undefined);
    setIsLogoutModalOpen(false);
  };

  const handleCopyAddress = () => {
    if (currentAccount?.ethAddress) {
      navigator.clipboard.writeText(currentAccount.ethAddress);
      setIsCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="connect-button-container">
      <button
        className={`connect-button ${currentAccount ? 'connect-button--connected' : ''}`}
        onClick={handleButtonClick}
      >
        {currentAccount ? (
          <>
            <span className="address-text">
              {truncateAddress(currentAccount.ethAddress)}
            </span>
          </>
        ) : (
          'Connect Wallet'
        )}
      </button>

      {isLogoutModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsLogoutModalOpen(false)}>
              ×
            </button>
            <div className="logout-modal-content">
              <h2>Account Details</h2>
              <div className="address-container">
                <span className="full-address">{currentAccount?.ethAddress}</span>
                <button 
                  className={`copy-button ${isCopied ? 'copy-button--copied' : ''}`} 
                  onClick={handleCopyAddress}
                  disabled={isCopied}
                >
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              ×
            </button>
            <AuthModal />
          </div>
        </div>
      )}
    </div>
  );
}
