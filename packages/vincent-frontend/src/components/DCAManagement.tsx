import { useEffect, useState } from 'react';
import { RegisterDCA } from './RegisterDCA';
import { ActiveDCAs } from './ActiveDCAs';

// Base Mainnet Etherscan API
const BASE_API_URL = 'https://api.basescan.org/api';
const API_KEY = import.meta.env.VITE_BASESCAN_API_KEY;

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
}

function TransactionList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="no-transactions">
        No transactions found for this address
      </div>
    );
  }

  return (
    <div className="transactions-list">
      {transactions.map((tx) => (
        <div key={tx.hash} className="transaction-item">
          <div className="transaction-header">
            <span className="transaction-date">
              {new Date(Number(tx.timeStamp) * 1000).toLocaleDateString()}
            </span>
            <a 
              href={`https://basescan.org/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transaction-link"
            >
              View
            </a>
          </div>
          <div className="transaction-details">
            <div>From: {tx.from}</div>
            <div>To: {tx.to}</div>
            <div>Value: {Number(tx.value) / 1e18} ETH</div>
          </div>
        </div>
      ))}
    </div>
  );
}

type Tab = 'register' | 'transactions' | 'view';

interface DCAManagementViewProps {
  address: string;
}

export function DCAManagementView({ address }: DCAManagementViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('register');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab, address]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${BASE_API_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === '1') {
        setTransactions(data.result || []);
      } else {
        setError(data.message || 'Failed to fetch transactions. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDCASubmit = async (amount: number, frequency: string) => {
    // TODO: Implement DCA creation logic
    console.log('Creating DCA with:', { amount, frequency, address });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'register':
        return (
          <div className="tab-content">
            <h2>Register New DCA</h2>
            <RegisterDCA onSubmit={handleDCASubmit} />
          </div>
        );
      case 'transactions':
        return (
          <div className="tab-content">
            <h2>DCA Transactions</h2>
            {isLoading ? (
              <div className="loading">Loading transactions...</div>
            ) : error ? (
              <div className="error">{error}</div>
            ) : (
              <TransactionList transactions={transactions} />
            )}
          </div>
        );
      case 'view':
        return (
          <div className="tab-content">
            <h2>Active DCAs</h2>
            <ActiveDCAs address={address} />
          </div>
        );
    }
  };

  return (
    <div className="card dca-management">
      <header>
        <h1>DCA Dashboard</h1>
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Register DCA
          </button>
          <button 
            className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            See DCA Transactions
          </button>
          <button 
            className={`tab-btn ${activeTab === 'view' ? 'active' : ''}`}
            onClick={() => setActiveTab('view')}
          >
            View DCAs
          </button>
        </div>
      </header>
      <main>
        {renderTabContent()}
      </main>
    </div>
  );
} 