import React from 'react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';

import { Button } from '@/components/shared/ui/button';

interface WithdrawPanelProps {
  withdrawAddress: string;
  setWithdrawAddress: (value: string) => void;
  withdrawAmount: string;
  setWithdrawAmount: (value: string) => void;
  tokenSymbol: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  confirmationMode?: boolean;
  onCancel?: () => void;
}

export const WithdrawPanel: React.FC<WithdrawPanelProps> = ({
  withdrawAddress,
  setWithdrawAddress,
  withdrawAmount,
  setWithdrawAmount,
  tokenSymbol,
  loading,
  onSubmit,
  confirmationMode = false,
  onCancel,
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
    <div className={`p-4 border rounded mb-4 ${theme.cardBg} ${theme.cardBorder}`}>
      <h5 className={`font-medium mb-3 ${theme.text}`}>Withdrawal Details</h5>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className={`block text-sm mb-1 ${theme.text}`}>Recipient Address</label>
          <input
            type="text"
            value={withdrawAddress}
            onChange={(e) => setWithdrawAddress(e.target.value)}
            placeholder="0x..."
            className={`w-full p-2 border rounded ${theme.cardBg} ${theme.cardBorder} ${theme.text}`}
          />
        </div>
        <div>
          <label className={`block text-sm mb-1 ${theme.text}`}>Amount</label>
          <div className="flex">
            <input
              type="text"
              value={withdrawAmount}
              onChange={handleAmountChange}
              placeholder="0.0"
              className={`flex-1 p-2 border rounded-l ${theme.cardBg} ${theme.cardBorder} ${theme.text}`}
            />
            <span
              className={`p-2 ${theme.itemBg} border border-l-0 rounded-r ${theme.cardBorder} ${theme.text}`}
            >
              {tokenSymbol || 'ETH'}
            </span>
          </div>
        </div>
        {confirmationMode ? (
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Processing...' : 'Confirm'}
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="submit"
            disabled={
              loading || !withdrawAddress || !withdrawAmount || parseFloat(withdrawAmount) <= 0
            }
            className="w-full disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Withdraw'}
          </Button>
        )}
      </form>
    </div>
  );
};
