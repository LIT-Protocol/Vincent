import React from 'react';
import { AppView, ContractVersionResult, VersionParameter } from '../../types';
import { NavigateFunction } from 'react-router-dom';
import StatusMessage from '../authForm/StatusMessage';
import VersionParametersForm from '../authForm/VersionParametersForm';
import ConsentActions from '../authForm/ConsentActions';
import { IRelayPKP } from '@lit-protocol/types';

type StatusType = 'info' | 'warning' | 'success' | 'error' | undefined;

interface MainConsentFormViewProps {
  appInfo: AppView;
  versionInfo: ContractVersionResult | null;
  agentPKP: IRelayPKP;
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
  appInfo,
  versionInfo,
  agentPKP,
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

      <div className="text-xl font-semibold text-center mb-2 break-words">
        {appInfo.name} wants to use your Agent Wallet
      </div>

      {appInfo.description && (
        <div className="text-center text-gray-600 text-sm mb-4 break-words">
          {appInfo.description}
          <br></br>
          Version: {versionInfo ? versionInfo.appVersion.version.toString() : 'No version data'} •
          App Mode:{' '}
          {appInfo.deploymentStatus === 0
            ? 'DEV'
            : appInfo.deploymentStatus === 1
              ? 'TEST'
              : appInfo.deploymentStatus === 2
                ? 'PROD'
                : 'Unknown'}
        </div>
      )}

      {agentPKP && (
        <div className="text-center text-gray-500 text-sm font-mono bg-gray-50 py-2 px-3 rounded-md mb-6 border border-gray-100 overflow-hidden overflow-ellipsis">
          EVM Address: {agentPKP.ethAddress}
        </div>
      )}

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
