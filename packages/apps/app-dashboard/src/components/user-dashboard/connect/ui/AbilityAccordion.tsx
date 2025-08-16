import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { AbilityHeader } from './AbilityHeader';
import { RequiredPolicies } from './RequiredPolicies';
import { PolicyFormRef } from './PolicyForm';
import { theme } from './theme';

interface AbilityAccordionProps {
  ability: {
    abilityPackageName: string;
    abilityVersion: string;
    hiddenSupportedPolicies?: string[];
  };
  abilityVersion?: {
    ipfsCid: string;
  };
  policies: Array<any>;
  connectInfoMap: ConnectInfoMap;
  formData: Record<string, any>;
  onFormChange: (abilityIpfsCid: string, policyIpfsCid: string, data: any) => void;
  onRegisterFormRef: (policyIpfsCid: string, ref: PolicyFormRef) => void;
  abilityIpfsCid: string;
  defaultExpanded?: boolean;
  selectedPolicies: Record<string, boolean>;
  onPolicySelectionChange: (
    abilityIpfsCid: string,
    policyIpfsCid: string,
    selected: boolean,
  ) => void;
}

export function AbilityAccordion({
  ability,
  abilityVersion,
  policies,
  connectInfoMap,
  formData,
  onFormChange,
  onRegisterFormRef,
  abilityIpfsCid,
  defaultExpanded = true,
  selectedPolicies,
  onPolicySelectionChange,
}: AbilityAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`backdrop-blur-xl ${theme.cardBg} border ${theme.cardBorder} rounded-lg overflow-hidden`}
    >
      <div className="p-0">
        {/* Clickable Header */}
        <div
          onClick={toggleExpanded}
          className={`py-2 px-2 sm:py-2.5 sm:px-3 cursor-pointer ${theme.itemHoverBg} transition-colors ${policies.length > 0 ? `border-b ${theme.cardBorder} ${!isExpanded ? 'border-b-0' : ''}` : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <AbilityHeader
                ability={ability}
                abilityVersion={abilityVersion}
                connectInfoMap={connectInfoMap}
              />
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <ChevronRight className={`w-5 h-5 ${theme.textMuted}`} />
            </motion.div>
          </div>
        </div>

        {/* Expandable Content - Only show if there are policies */}
        {policies.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-2 sm:px-3 py-1.5">
              <RequiredPolicies
                policies={policies}
                connectInfoMap={connectInfoMap}
                formData={formData}
                onFormChange={onFormChange}
                onRegisterFormRef={onRegisterFormRef}
                abilityIpfsCid={abilityIpfsCid}
                selectedPolicies={selectedPolicies}
                onPolicySelectionChange={onPolicySelectionChange}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
