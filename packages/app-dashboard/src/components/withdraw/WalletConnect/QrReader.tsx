import { Button } from '@/components/ui/button';
import Loading from '@/components/layout/Loading';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Fragment, useState } from 'react';

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
    <div className="container">
      {show ? (
        <Fragment>
          {loading && (
            <div className="absolute">
              <Loading />
            </div>
          )}
          <div className="qrVideoMask">
            <ReactQrReader
              onLoad={() => setLoading(false)}
              showViewFinder={false}
              onError={onError}
              onScan={onScan}
              style={{ width: '100%' }}
            />
          </div>
        </Fragment>
      ) : (
        <div className="container qrPlaceholder">
          <Image
            src="/icons/qr-icon.svg"
            width={100}
            height={100}
            alt="qr code icon"
            className="qrIcon"
          />
          <Button
            variant="default"
            className="mt-10 w-full"
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
