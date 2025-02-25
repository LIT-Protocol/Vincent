export function ApproveView() {
  const handleApprove = () => {
    window.location.href = 'http://localhost:3000/?managementWallet=0xD4383c15158B11a4Fa51F489ABCB3D4E43511b0a&roleId=a5b83467-4ac9-49b6-b45c-28552f51b026';
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