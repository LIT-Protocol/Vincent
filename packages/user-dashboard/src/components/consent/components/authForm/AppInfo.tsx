import { AppView, ContractVersionResult } from '../../types';
import { checkForDuplicates } from '../../utils/hasDuplicates';
import { IRelayPKP } from '@lit-protocol/types';

interface AppInfoProps {
  appInfo: AppView;
  agentPKP?: IRelayPKP;
  versionInfo?: ContractVersionResult;
  showIPFSDetails?: boolean;
}

const AppInfo = ({
  appInfo,
  versionInfo,
  showIPFSDetails = true
}: AppInfoProps) => {
  const duplicateInfo = checkForDuplicates(versionInfo);
  const hasDuplicates = duplicateInfo.hasDuplicates;

  return (
    <div className='mt-4 mb-6'>
      {hasDuplicates && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p className="font-medium mb-1">⚠️ Warning: Suspicious Application Configuration</p>
          <p className="text-xs">
            This application contains duplicate identifiers which could indicate malicious behavior:
          </p>
          <ul className="ml-4 mt-1 text-xs list-disc">
            {duplicateInfo.hasDuplicateTools && (
              <li>Duplicate Tool IPFS CIDs</li>
            )}
            {duplicateInfo.hasDuplicatePolicies && (
              <li>Duplicate Policy IPFS CIDs</li>
            )}
            {duplicateInfo.hasDuplicateParams && (
              <li>Duplicate Parameter names</li>
            )}
          </ul>
          <p className="text-xs mt-1">
            Please verify this application carefully before consenting.
          </p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-xs text-gray-500 mb-2">
          {versionInfo && versionInfo.appVersion.version.hex && 
            `App Version: ${parseInt(versionInfo.appVersion.version.hex, 16).toString()}`}
          {versionInfo && versionInfo.appVersion.version.hex && appInfo.deploymentStatus !== undefined && ' • '}
          {appInfo.deploymentStatus !== undefined &&
            `App Mode: ${appInfo.deploymentStatus === 0 ? 'DEV' :
                       appInfo.deploymentStatus === 1 ? 'TEST' :
                       appInfo.deploymentStatus === 2 ? 'PROD' : 'Unknown'}`
          }
        </div>
      </div>
      
      {showIPFSDetails && versionInfo && (
        <div className="mt-2 text-xs border-t border-gray-200 pt-2">
          <div className="text-gray-700 font-medium mb-1">IPFS CIDs:</div>
          {(() => {
            const tools = versionInfo.appVersion.tools;

            if (!Array.isArray(tools) || tools.length === 0) {
              return <p className="italic text-gray-500">No tools configured</p>;
            }

            return tools.map((tool, toolIndex) => {
              if (!tool) return null;

              const toolIpfsCid = tool.toolIpfsCid;
              const policies = tool.policies;

              return (
                <div key={`tool-${toolIndex}`} className="mb-2">
                  <div>
                    <span className="text-gray-600">Tool:</span>{' '}
                    <span className="break-all font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                      {toolIpfsCid}
                    </span>
                  </div>

                  {Array.isArray(policies) && policies.length > 0 && (
                    <div className="mt-1 pl-3">
                      {policies.map((policy, policyIndex) => {
                        if (!policy) return null;

                        const policyIpfsCid = policy.policyIpfsCid;

                        return (
                          <div key={`policy-${toolIndex}-${policyIndex}`} className="mt-1">
                            <span className="text-gray-600">Policy:</span>{' '}
                            <span className="break-all font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                              {policyIpfsCid}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
};

export default AppInfo; 