import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { ConsentInfoMap } from '@/hooks/user-dashboard/consent/useConsentInfo';
import { ToolHeader } from './ToolHeader';
import { RequiredPolicies } from './RequiredPolicies';
import { PolicyFormRef } from './PolicyForm';
import { ThemeType } from './theme';

interface ToolAccordionProps {
  tool: {
    toolPackageName: string;
    toolVersion: string;
    hiddenSupportedPolicies?: string[];
  };
  toolVersion?: {
    ipfsCid: string;
  };
  policies: Array<any>;
  consentInfoMap: ConsentInfoMap;
  theme: ThemeType;
  isDark: boolean;
  formData: Record<string, any>;
  onFormChange: (toolIpfsCid: string, policyIpfsCid: string, data: any) => void;
  onRegisterFormRef: (policyIpfsCid: string, ref: PolicyFormRef) => void;
  toolIpfsCid: string;
  defaultExpanded?: boolean;
}

export function ToolAccordion({
  tool,
  toolVersion,
  policies,
  consentInfoMap,
  theme,
  isDark,
  formData,
  onFormChange,
  onRegisterFormRef,
  toolIpfsCid,
  defaultExpanded = true,
}: ToolAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className={`backdrop-blur-xl ${theme.cardBg} border ${theme.cardBorder}`}>
      <CardContent className="p-0">
        {/* Clickable Header */}
        <div
          onClick={toggleExpanded}
          className={`p-3 sm:p-6 cursor-pointer ${theme.itemHoverBg} transition-colors border-b ${theme.cardBorder} ${!isExpanded ? 'border-b-0' : ''}`}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <ChevronRight className={`w-5 h-5 ${theme.textMuted}`} />
            </motion.div>
            <div className="flex-1">
              <ToolHeader
                tool={tool}
                toolVersion={toolVersion}
                consentInfoMap={consentInfoMap}
                theme={theme}
              />
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="p-3 sm:p-6 pt-4">
            <RequiredPolicies
              policies={policies}
              consentInfoMap={consentInfoMap}
              theme={theme}
              isDark={isDark}
              formData={formData}
              onFormChange={onFormChange}
              onRegisterFormRef={onRegisterFormRef}
              toolIpfsCid={toolIpfsCid}
            />
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
