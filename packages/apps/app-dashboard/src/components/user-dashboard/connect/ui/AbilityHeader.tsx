import { Settings } from 'lucide-react';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { Logo } from '@/components/shared/ui/Logo';
import { theme } from './theme';

interface AbilityHeaderProps {
  ability: {
    abilityPackageName: string;
    abilityVersion: string;
  };
  abilityVersion?: {
    ipfsCid: string;
  };
  connectInfoMap: ConnectInfoMap;
}

export function AbilityHeader({ ability, abilityVersion, connectInfoMap }: AbilityHeaderProps) {
  const abilityData = connectInfoMap.abilitiesByPackageName[ability.abilityPackageName];

  return (
    <div className="flex items-center gap-3">
      <div>
        {abilityData?.logo && abilityData.logo.length >= 10 ? (
          <Logo
            logo={abilityData.logo}
            alt={`${ability.abilityPackageName} logo`}
            className="w-7 h-7 object-contain"
          />
        ) : (
          <Settings className={`w-7 h-7 ${theme.textMuted}`} />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className={`font-semibold ${theme.text}`}>
            {connectInfoMap.abilitiesByPackageName[ability.abilityPackageName]?.title ||
              ability.abilityPackageName}
          </h4>
          <a
            href={`https://www.npmjs.com/package/${ability.abilityPackageName}/v/${ability.abilityVersion}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-75 transition-opacity"
            title={`View ${ability.abilityPackageName} on npm`}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <img src="/npm.png" alt="npm" className="w-full h-full object-contain" />
            </div>
          </a>
          {abilityVersion && (
            <a
              href={`https://ipfs.io/ipfs/${abilityVersion.ipfsCid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-75 transition-opacity"
              title={`View ${abilityVersion.ipfsCid} on IPFS`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <img src="/ipfs.png" alt="IPFS" className="w-full h-full object-contain" />
              </div>
            </a>
          )}
        </div>
        {connectInfoMap.abilitiesByPackageName[ability.abilityPackageName]?.description && (
          <p className={`text-sm ${theme.textSubtle} mt-1`}>
            {connectInfoMap.abilitiesByPackageName[ability.abilityPackageName].description}
          </p>
        )}
      </div>
    </div>
  );
}
