import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import Loading from '@/components/shared/ui/Loading';
import { theme, fonts } from '@/lib/themeClasses';

interface CreateAppSubmittingProps {
  submissionStatus: 'signing' | 'confirming' | 'creating-registry' | null;
}

export function CreateAppSubmitting({ submissionStatus }: CreateAppSubmittingProps) {
  const navigate = useNavigate();

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Apps', onClick: () => navigate('/developer/apps') },
          { label: 'Create App' },
        ]}
      />
      <Loading />
      <div className="text-center mt-4">
        {submissionStatus === 'signing' ? (
          <>
            <p className={`text-lg font-semibold ${theme.text} mb-2`} style={fonts.heading}>
              Please sign the transaction
            </p>
            <p className={`${theme.textMuted} text-sm`} style={fonts.body}>
              Check your wallet to approve the app registration transaction
            </p>
          </>
        ) : submissionStatus === 'confirming' ? (
          <>
            <p className={`text-lg font-semibold ${theme.text} mb-2`} style={fonts.heading}>
              Waiting for confirmation
            </p>
            <p className={`${theme.textMuted} text-sm`} style={fonts.body}>
              Your transaction has been submitted and is being confirmed on-chain
            </p>
            <p className={`${theme.textMuted} text-xs mt-2`} style={fonts.body}>
              This typically takes 15-30 seconds
            </p>
          </>
        ) : submissionStatus === 'creating-registry' ? (
          <>
            <p className={`text-lg font-semibold ${theme.text} mb-2`} style={fonts.heading}>
              Creating registry records
            </p>
            <p className={`${theme.textMuted} text-sm`} style={fonts.body}>
              Adding app, version, and abilities to the Vincent Registry
            </p>
            <p className={`${theme.textMuted} text-xs mt-2`} style={fonts.body}>
              Almost done...
            </p>
          </>
        ) : null}
      </div>
    </>
  );
}
