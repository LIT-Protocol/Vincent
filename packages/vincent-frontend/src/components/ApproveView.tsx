import React from 'react';

export function ApproveView() {
  const handleApprove = () => {
    window.location.href = 'http://localhost:3000/?appId=123';
  };

  return (
    <div className="card">
      <header>
        <h1>Memecoin DCA</h1>
      </header>
      <main>
        <button className="approve-btn" onClick={handleApprove}>
          Approve Agent
        </button>
      </main>
    </div>
  );
} 