import { ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { AppVersionTool, Tool } from '@/types/developer-dashboard/appTypes';
import { ToolVersionPoliciesWrapper } from '../wrappers/ui/ToolVersionPolicyWrapper';
import { useState } from 'react';

interface ToolInfoViewProps {
  appVersionTool: AppVersionTool;
  tool: Tool;
}

export function ToolInfoView({ appVersionTool, tool }: ToolInfoViewProps) {
  const { isDark, theme } = useTheme();
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const handleToolClick = (toolPackageName: string) => {
    setExpandedTool(expandedTool === toolPackageName ? null : toolPackageName);
  };

  return (
    <div key={tool.packageName} className="space-y-3">
      {/* Clickable Tool Card */}
      <div
        className={`group/tool p-5 rounded-xl ${theme.itemBg} ${theme.itemHoverBg} border ${theme.itemBorder} ${theme.itemHoverBorder} cursor-pointer transition-all duration-300`}
        onClick={() => handleToolClick(tool.packageName)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-2 rounded-lg ${theme.iconBg} border ${theme.itemBorder} group-hover/tool:${theme.itemHoverBorder} transition-all duration-300`}
            >
              <Wrench className={`w-4 h-4 ${theme.iconColorMuted}`} />
            </div>
            <div className="flex-1">
              <p className={`text-base font-light ${isDark ? 'text-white/90' : 'text-black/90'}`}>
                {tool.title || tool.packageName}
              </p>
              <p className={`text-xs ${theme.textSubtle}`}>
                {tool.packageName} v{tool.activeVersion}
              </p>
              {tool.description && (
                <p className={`text-sm ${theme.textMuted} mt-1 leading-relaxed`}>
                  {tool.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {appVersionTool.hiddenSupportedPolicies &&
              appVersionTool.hiddenSupportedPolicies.length > 0 && (
                <span
                  className={`px-3 py-1 ${theme.iconBg} ${isDark ? 'text-white/60' : 'text-black/60'} text-xs rounded-full border ${theme.iconBorder}`}
                >
                  {appVersionTool.hiddenSupportedPolicies.length} Hidden Policies
                </span>
              )}
            <span
              className={`text-xs ${isDark ? 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10' : 'text-black/70 hover:text-black bg-black/5 hover:bg-black/10'} font-medium flex items-center gap-1 transition-all duration-300 px-2 py-1 rounded-md`}
            >
              {expandedTool === appVersionTool.toolPackageName ? (
                <>
                  Hide policies <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  Show policies <ChevronDown className="w-3 h-3" />
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Tool Policies - Show below the tool card when expanded */}
      {expandedTool === appVersionTool.toolPackageName && (
        <div
          className={`ml-4 pl-4 border-l-2 ${isDark ? 'border-blue-400/30' : 'border-blue-600/30'} animate-fadeIn`}
        >
          {appVersionTool.toolVersion ? (
            <ToolVersionPoliciesWrapper appToolVersion={appVersionTool} />
          ) : (
            <p className={`text-sm ${theme.textMuted}`}>
              No policy information available for this tool.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
