import { Button } from '@/components/ui/button';
import Loading from '@/components/layout/Loading';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Fragment, useState } from 'react';
import StatusMessage from '../StatusMessage';

/**
 * You can use normal import if you are not within next / ssr environment
 * @info https://nextjs.org/docs/advanced-features/dynamic-import
 */
const ReactQrReader = dynamic(() => import('react-qr-reader-es6'), { ssr: false });

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
  const [scanError, setScanError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);

  function onError(error: any) {
    const errorMessage = error?.message || 'Unknown camera error';
    console.error('QR scanner error:', error);
    setScanError(`Camera Error: ${errorMessage}`);
    setDebugInfo(`Camera Error Details: ${JSON.stringify(error)}`);
    setShow(false);
  }

  async function onScan(data: string | null) {
    if (data) {
      try {
        setScannedData(data);
        const debugMsg = `Scanned QR data: ${data.substring(0, 20)}${data.length > 20 ? '...' : ''}`;
        console.log(debugMsg);
        setDebugInfo(debugMsg);
        setScanError(null);
        setLoading(true);

        // Validate URI format (basic check)
        if (!data.startsWith('wc:')) {
          const invalidFormatMsg = `Invalid QR format: Expected WalletConnect URI starting with "wc:". Got: ${data.substring(0, 15)}...`;
          setScanError(invalidFormatMsg);
          setDebugInfo(invalidFormatMsg);
          setLoading(false);
          return;
        }

        setDebugInfo(`Attempting to connect with URI: ${data.substring(0, 15)}...`);
        await onConnect(data);
        setDebugInfo(`Connection process completed for: ${data.substring(0, 15)}...`);
        setLoading(false);
        setShow(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error connecting with scanned QR code:', error);
        setScanError(`Connection Error: ${errorMessage}`);
        setDebugInfo(
          `Connection Error Details: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`,
        );
        setLoading(false);
      }
    }
  }

  function onShowScanner() {
    setScanError(null);
    setDebugInfo('Starting QR scanner...');
    setLoading(true);
    setShow(true);
  }

  return (
    <div className="w-full flex flex-col items-center justify-center mb-6">
      {debugInfo && <StatusMessage message={debugInfo} type="info" />}

      {show ? (
        <Fragment>
          {loading && (
            <div className="absolute z-10">
              <Loading />
            </div>
          )}
          <div
            className="w-full max-w-md relative overflow-hidden rounded-lg border border-gray-300"
            style={{ height: '300px' }}
          >
            <ReactQrReader
              onLoad={() => {
                setLoading(false);
                setDebugInfo('Camera loaded successfully. Ready to scan.');
              }}
              showViewFinder={false}
              onError={onError}
              onScan={onScan}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          {scanError && (
            <div className="w-full mt-2 p-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded">
              {scanError}
            </div>
          )}
          {scannedData && (
            <div className="w-full mt-2 p-2 bg-blue-50 border border-blue-100 text-blue-600 text-sm rounded overflow-auto">
              <p className="font-bold">Raw QR Data:</p>
              <p className="text-xs break-all">{scannedData}</p>
            </div>
          )}
          <Button variant="outline" className="mt-4" onClick={() => setShow(false)}>
            Cancel Scan
          </Button>
        </Fragment>
      ) : (
        <div className="w-full max-w-md flex flex-col items-center justify-center p-8 border border-gray-200 rounded-lg bg-gray-50">
          <Image
            src="/icons/qr-icon.svg"
            width={100}
            height={100}
            alt="qr code icon"
            className="mb-4"
          />
          <Button
            variant="default"
            className="mt-4 w-full"
            onClick={onShowScanner}
            data-testid="qrcode-button"
          >
            Scan QR code
          </Button>
          {scanError && (
            <div className="w-full mt-2 p-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded">
              {scanError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
