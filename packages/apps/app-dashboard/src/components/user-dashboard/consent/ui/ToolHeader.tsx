import { Settings } from 'lucide-react';
import { ConsentInfoMap } from '@/hooks/user-dashboard/consent/useConsentInfo';
import { ThemeType } from './theme';

interface ToolHeaderProps {
  tool: {
    toolPackageName: string;
    toolVersion: string;
  };
  toolVersion?: {
    ipfsCid: string;
  };
  consentInfoMap: ConsentInfoMap;
  theme: ThemeType;
}

export function ToolHeader({ tool, toolVersion, consentInfoMap, theme }: ToolHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${theme.iconBg} border ${theme.iconBorder}`}>
          <Settings className={`w-5 h-5 ${theme.textMuted}`} />
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold ${theme.text}`}>
            {consentInfoMap.toolsByPackageName[tool.toolPackageName]?.title || tool.toolPackageName}
          </h4>
          <div className={`flex items-center gap-2 text-sm ${theme.textMuted} font-medium mt-1`}>
            <span>
              {tool.toolPackageName} - v{tool.toolVersion}
            </span>
            <a
              href={`https://www.npmjs.com/package/${tool.toolPackageName}/v/${tool.toolVersion}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-75 transition-opacity"
              title={`View ${tool.toolPackageName} on npm`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <img src="/npm.png" alt="npm" className="w-full h-full object-contain" />
              </div>
            </a>
            {toolVersion && (
              <a
                href={`https://ipfs.io/ipfs/${toolVersion.ipfsCid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-75 transition-opacity"
                title={`View ${toolVersion.ipfsCid} on IPFS`}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <img src="/ipfs.png" alt="IPFS" className="w-full h-full object-contain" />
                </div>
              </a>
            )}
          </div>
          {consentInfoMap.toolsByPackageName[tool.toolPackageName]?.description && (
            <p className={`text-sm ${theme.textSubtle} mt-1`}>
              {consentInfoMap.toolsByPackageName[tool.toolPackageName].description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
