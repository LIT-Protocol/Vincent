import React from 'react';

interface WalletInfoProps {
  ethAddress?: string;
}

const WalletInfo: React.FC<WalletInfoProps> = ({ ethAddress }) => {
  return (
    <div className="mt-6 p-4 rounded-md bg-gray-50 border border-gray-200">
      <h3>Wallet Information</h3>
      <div className="mb-2 break-all text-sm text-gray-600">
        <strong>EVM Address:</strong> {ethAddress || 'Not available'}
      </div>
    </div>
  );
};

export default WalletInfo;
