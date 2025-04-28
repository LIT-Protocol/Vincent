import React from 'react';

import { Button } from '@/components/ui/button';

interface WithdrawPanelProps {
  withdrawAddress: string;
  setWithdrawAddress: (value: string) => void;
  withdrawAmount: string;
  setWithdrawAmount: (value: string) => void;
  tokenSymbol: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const WithdrawPanel: React.FC<WithdrawPanelProps> = ({
  withdrawAddress,
  setWithdrawAddress,
  withdrawAmount,
  setWithdrawAmount,
  tokenSymbol,
  loading,
  onSubmit
}) => {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === '') {
      setWithdrawAmount('');
      return;
    }

    // Allow inputs that start with digits or with a decimal point
    if (/^((0|[1-9]\d*)(\.\d*)?|\.\d*)$/.test(value)) {
      setWithdrawAmount(value);
    }
  };

  return (
    <div className="p-4 border rounded mb-4">
      <h5 className="font-medium mb-3">Withdrawal Details</h5>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">
            Recipient Address
          </label>
          <input
            type="text"
            value={withdrawAddress}
            onChange={(e) => setWithdrawAddress(e.target.value)}
            placeholder="0x..."
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">
            Amount
          </label>
          <div className="flex">
            <input
              type="text"
              value={withdrawAmount}
              onChange={handleAmountChange}
              placeholder="0.0"
              className="flex-1 p-2 border rounded-l"
            />
            <span className="p-2 bg-gray-100 border border-l-0 rounded-r">
              {tokenSymbol || 'ETH'}
            </span>
          </div>
        </div>
        <Button
          variant="default"
          type="submit"
          disabled={loading || !withdrawAddress || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
          className="w-full disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Withdraw'}
        </Button>
      </form>
    </div>
  );
};
