import { Button } from '@/components/shared/ui/button';
import { Fragment, useState } from 'react';
import ReactQrReader from 'react-qr-reader-es6';
import { theme } from '@/components/user-dashboard/connect/ui/theme';

/**
 * Types
 */
interface IProps {
  onConnect: (uri: string) => Promise<void>;
}

/**
 * Component
 */
export default function QrReader({ onConnect }: IProps) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  function onError() {
    setShow(false);
  }

  async function onScan(data: string | null) {
    if (data) {
      await onConnect(data);
      setShow(false);
    }
  }

  function onShowScanner() {
    setLoading(true);
    setShow(true);
  }

  return (
    <div className="w-full flex flex-col items-center justify-center mb-6">
      {show ? (
        <Fragment>
          {loading && (
            <div className="absolute z-10">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            </div>
          )}
          <div
            className={`w-full relative overflow-hidden rounded-lg border ${theme.cardBorder}`}
            style={{ height: '300px' }}
          >
            <ReactQrReader
              onLoad={() => setLoading(false)}
              showViewFinder={false}
              onError={onError}
              onScan={onScan}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <Button
            variant="outline"
            className={`mt-4 ${theme.text} border ${theme.cardBorder} hover:${theme.itemHoverBg}`}
            onClick={() => setShow(false)}
          >
            Cancel Scan
          </Button>
        </Fragment>
      ) : (
        <div
          className={`w-full flex flex-col items-center justify-center p-8 border ${theme.cardBorder} rounded-lg ${theme.mainCard}`}
        >
          <img
            src="/icons/qr-icon.svg"
            width={100}
            height={100}
            alt="qr code icon"
            className="mb-4 opacity-90 dark:opacity-80"
          />
          <Button
            variant="outline"
            className={`mt-4 w-full font-normal ${theme.text} border ${theme.cardBorder} hover:${theme.itemHoverBg}`}
            onClick={onShowScanner}
            data-testid="qrcode-button"
          >
            Scan QR code
          </Button>
        </div>
      )}
    </div>
  );
}
