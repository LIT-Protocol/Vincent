import { useLitContext } from '@/providers/LitContext';
import { ReactNode } from 'react';
import { styles } from './style';

type StateWrapperProps = {
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyComponent?: ReactNode;
  errorConfig?: {
    onRetry?: () => void;
  };
  loadingLabel?: string;
};

export function StateWrapper({
  children,
  loading = false,
  error = null,
  isEmpty = false,
  emptyComponent,
  errorConfig = {},
  loadingLabel = 'Loading',
}: StateWrapperProps) {
  const { isConnected } = useLitContext();

  // Wallet not connected state
  if (!isConnected) {
    return (
      <div className={styles.card.dashed}>
        <div className={styles.header.default}>
          <h2 className={styles.title.default}>Connect Wallet</h2>
        </div>
        <div className={styles.container.content}>
          <p className={styles.text.centered}>
            Please connect your wallet to view your applications
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={styles.card.default}>
        <div className={styles.header.default}>
          <h2 className={styles.title.default}>{loadingLabel}</h2>
        </div>
        <div className={styles.container.content}>
          <div className={styles.container.centered}>
            <div className={styles.spinner}></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.card.error}>
        <div className={styles.header.default}>
          <h2 className={styles.title.default}>Error Loading Applications</h2>
        </div>
        <div className={styles.container.content}>
          <p className={styles.text.error}>{error}</p>
          <button
            className={styles.button.outline}
            onClick={errorConfig.onRetry || (() => window.location.reload())}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    // Render the provided empty component if available
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }

    // Default empty state if no custom component is provided
    return (
      <div className={styles.card.dashed}>
        <div className={styles.header.default}>
          <h2 className={styles.title.default}>No Data Found</h2>
        </div>
        <div className={styles.container.content}>
          <p className={styles.text.centered}>No data available</p>
        </div>
      </div>
    );
  }

  // Default: render children when all conditions are met
  return <>{children}</>;
}
