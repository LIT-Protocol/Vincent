import React, { useState } from 'react';

interface RegisterDCAProps {
  onSubmit: (amount: number, frequency: string) => void;
}

export function RegisterDCA({ onSubmit }: RegisterDCAProps) {
  const [amount, setAmount] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('daily');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    onSubmit(parsedAmount, frequency);
  };

  return (
    <form onSubmit={handleSubmit} className="dca-form">
      <div className="form-group">
        <label htmlFor="amount">DCA Amount (USDC)</label>
        <div className="input-wrapper">
          <span className="input-prefix">$</span>
          <input
            id="amount"
            type="number"
            step="1"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            required
            className="form-input with-prefix"
          />
          <span className="input-suffix">USDC</span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="frequency">Frequency</label>
        <select
          id="frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="form-select"
        >
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {error && <div className="form-error">{error}</div>}

      <button type="submit" className="submit-btn">
        Create DCA
      </button>
    </form>
  );
} 