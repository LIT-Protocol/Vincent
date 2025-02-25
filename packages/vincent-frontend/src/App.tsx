import { useEffect, useState } from 'react';
import { ApproveView } from './components/ApproveView';
import { DCAManagementView } from './components/DCAManagement';
import './App.css';

function App() {
  const [pkpAddress, setPkpAddress] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const address = params.get('pkpEthAddress');
    if (address) {
      setPkpAddress(address);
    }
  }, []);

  return (
    <div className="container">
      {pkpAddress ? <DCAManagementView address={pkpAddress} /> : <ApproveView />}
    </div>
  );
}

export default App;
