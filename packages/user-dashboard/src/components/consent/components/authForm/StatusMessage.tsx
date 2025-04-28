interface StatusMessageProps {
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
}

const StatusMessage = ({ message, type = 'info' }: StatusMessageProps) => {
  if (!message) return null;
  
  const getStatusClass = () => {
    switch (type) {
      case 'warning': return 'status-message--warning';
      case 'success': return 'status-message--success';
      case 'error': return 'status-message--error';
      default: return 'status-message--info';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <div className="status-icon warning-icon">
            <svg viewBox="0 0 24 24" fill="none" className="status-svg">
              <path d="M12 9v4M12 16h.01M9.172 19h6.656a2 2 0 001.789-1.106l3.331-6.663a2 2 0 000-1.789L17.617 2.78A2 2 0 0015.829 1.67H9.172a2 2 0 00-1.789 1.106L4.052 9.439a2 2 0 000 1.789l3.331 6.663A2 2 0 009.172 19z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="status-icon success-icon">
            <svg viewBox="0 0 24 24" fill="none" className="status-svg">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="status-icon error-icon">
            <svg viewBox="0 0 24 24" fill="none" className="status-svg">
              <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      default:
        return <div className="spinner"></div>;
    }
  };
  
  return (
    <div className={`status-message ${getStatusClass()}`}>
      {getIcon()}
      <span className="status-text">{message}</span>
    </div>
  );
};

export default StatusMessage; 