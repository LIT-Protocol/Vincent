import React from 'react';
import { ContractVersionResult, VersionParameter } from '@/types';
import { NavigateFunction } from 'react-router-dom';
import StatusMessage from './StatusMessage';
import VersionParametersForm from './VersionParametersForm';
import ConsentActions from './ConsentActions';

type StatusType = 'info' | 'warning' | 'success' | 'error' | undefined;

interface MainConsentFormViewProps {
  versionInfo: ContractVersionResult | null;
  permittedVersion: number | null;
  existingParameters: VersionParameter[];
  statusMessage: string;
  statusType: StatusType;
  submitting: boolean;
  useCurrentVersionOnly: boolean;
  navigate: NavigateFunction;
  handleApprove: () => void;
  handleParametersChange: (parameters: VersionParameter[]) => void;
}

/**
 * The main consent form view component
 */
export const MainConsentFormView: React.FC<MainConsentFormViewProps> = ({
  versionInfo,
  permittedVersion,
  existingParameters,
  statusMessage,
  statusType,
  submitting,
  useCurrentVersionOnly,
  navigate,
  handleApprove,
  handleParametersChange,
}) => {
  return (
    <>
      {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}

      {versionInfo && (
        <VersionParametersForm
          versionInfo={versionInfo}
          onChange={handleParametersChange}
          existingParameters={existingParameters}
          key={`params-form-${useCurrentVersionOnly ? `v${permittedVersion}` : 'latest'}`}
        />
      )}

      <div className="text-xs text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg">
        You can change your parameters anytime by revisiting this page.
      </div>

      <ConsentActions
        onApprove={handleApprove}
        onDisapprove={() => {
          navigate('/user/apps');
        }}
        submitting={submitting}
      />
    </>
  );
};

export default MainConsentFormView;
