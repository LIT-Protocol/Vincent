import React from 'react';
import { AppView } from '../../types';
import { checkForDuplicates } from '../../utils/hasDuplicates';
import { IRelayPKP } from '@lit-protocol/types';

interface AppInfoProps {
  appInfo: AppView;
  agentPKP?: IRelayPKP;
  versionInfo?: any;
  showIPFSDetails?: boolean;
}

const AppInfo = ({
  appInfo,
  agentPKP,
  versionInfo,
  showIPFSDetails = true
}: AppInfoProps) => {
  const duplicateInfo = checkForDuplicates(versionInfo);
  const hasDuplicates = duplicateInfo.hasDuplicates;
  return (
    <div className='app-info'>
      <h2>App Information</h2>
      <div className='app-info-details'>
        <p>
          <strong>Name:</strong> {appInfo.name}
        </p>
        <p>
          <strong>Description:</strong> {appInfo.description}
        </p>
        <p>
          <strong>Version:</strong>{' '}
          {appInfo.latestVersion ? appInfo.latestVersion.toString() : '1'}
        </p> 
        
        {hasDuplicates && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px 15px', 
            backgroundColor: '#fef2f2', 
            border: '1px solid #f87171', 
            borderRadius: '6px',
            color: '#b91c1c'
          }}>
            <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>⚠️ Warning: Suspicious Application Configuration</p>
            <p style={{ fontSize: '14px' }}>
              This application contains duplicate identifiers which is suspicious and could indicate malicious behavior:
            </p>
            <ul style={{ marginLeft: '20px', marginTop: '5px', fontSize: '14px' }}>
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
            <p style={{ fontSize: '14px', marginTop: '5px' }}>
              Please verify this application carefully before consenting.
            </p>
          </div>
        )}
        <p>
          <strong>Deployment Status:</strong>{' '}
          {appInfo.deploymentStatus !== undefined ? 
            (appInfo.deploymentStatus === 0 ? 'DEV' : 
             appInfo.deploymentStatus === 1 ? 'TEST' : 
             appInfo.deploymentStatus === 2 ? 'PROD' : 'Unknown') 
            : 'DEV'}
        </p>
        {showIPFSDetails && versionInfo && (
          <div className="ipfs-cids-container" style={{ marginTop: '10px' }}>
            <strong>IPFS CIDs:</strong>
            <div style={{ marginTop: '8px' }}>
              {(() => {
                const toolsData = versionInfo.appVersion?.tools || versionInfo[1]?.[3];

                if (!toolsData || !Array.isArray(toolsData) || toolsData.length === 0) {
                  return <p style={{ fontStyle: 'italic' }}>No tools configured</p>;
                }

                return toolsData.map((tool: any, toolIndex: number) => {
                  if (!tool || !Array.isArray(tool) || !tool[0]) return null;

                  const toolIpfsCid = tool[0];
                  const policies = tool[1];

                  return (
                    <div key={`tool-${toolIndex}`} style={{ marginBottom: '10px' }}>
                      <div>
                        <strong>Tool:</strong>{' '}
                        <span style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#f5f5f5', padding: '3px 6px', borderRadius: '2px' }}>
                          {toolIpfsCid}
                        </span>
                      </div>

                      {Array.isArray(policies) && policies.length > 0 && (
                        <div style={{ marginTop: '5px', paddingLeft: '20px' }}>
                          {policies.map((policy: any, policyIndex: number) => {
                            if (!policy || !Array.isArray(policy) || !policy[0]) return null;

                            const policyIpfsCid = policy[0];

                            return (
                              <div key={`policy-${toolIndex}-${policyIndex}`} style={{ marginTop: '5px' }}>
                                <strong>Policy:</strong>{' '}
                                <span style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#f5f5f5', padding: '3px 6px', borderRadius: '2px' }}>
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
          </div>
        )}
        {agentPKP && (
          <p>
            <strong>Your Account Address:</strong> {agentPKP.ethAddress}
          </p>
        )}
      </div>
    </div>
  );
};

export default AppInfo; 