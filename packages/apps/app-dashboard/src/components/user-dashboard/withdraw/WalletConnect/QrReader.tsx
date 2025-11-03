import { Button } from '@/components/shared/ui/button';
import { Fragment, useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

/**
 * Types
 */
interface IProps {
  onConnect: (uri: string) => Promise<void>;
}

/**
 * Component
 */
export default function QrReaderComponent({ onConnect }: IProps) {
  const [show, setShow] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  async function handleScan(result: QrScanner.ScanResult) {
    const qrText = result.data;
    if (qrText) {
      // Let the parent component handle all status messages
      await onConnect(qrText);
      // Close scanner after successful connection
      handleCloseScanner();
    }
  }

  function onShowScanner() {
    setShow(true);
  }

  const handleCloseScanner = () => {
    // Properly stop and destroy QR scanner
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setShow(false);
  };

  // Initialize QR scanner when showing
  useEffect(() => {
    if (show && videoRef.current && !qrScannerRef.current) {
      qrScannerRef.current = new QrScanner(videoRef.current, handleScan, {
        highlightScanRegion: false,
        highlightCodeOutline: true,
      });
      qrScannerRef.current.start();
    }

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, [show]);

  return (
    <div className="w-full">
      {show ? (
        <Fragment>
          <div
            className={`w-full max-w-sm mx-auto relative overflow-hidden rounded-lg border ${theme.cardBorder}`}
            style={{ aspectRatio: '1/1' }}
          >
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          </div>
          <Button
            variant="outline"
            className={`mt-3 w-full ${theme.text} border ${theme.cardBorder} hover:${theme.itemHoverBg}`}
            style={fonts.body}
            onClick={handleCloseScanner}
          >
            Cancel Scan
          </Button>
        </Fragment>
      ) : (
        <Button
          variant="outline"
          className={`w-full font-normal ${theme.text} border ${theme.cardBorder} hover:${theme.itemHoverBg} flex items-center justify-center gap-2`}
          style={fonts.body}
          onClick={onShowScanner}
          data-testid="qrcode-button"
        >
          <img
            src="/icons/qr-icon.svg"
            width={20}
            height={20}
            alt="qr code icon"
            className="opacity-70"
          />
          Scan QR code
        </Button>
      )}
    </div>
  );
}
