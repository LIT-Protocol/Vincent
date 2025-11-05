import { motion } from 'framer-motion';
import { Button } from '@/components/shared/ui/button';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

interface UserPermissionButtonsProps {
  onUnpermit?: () => void;
  onSubmit: () => void;
  onBackToConsent?: () => void;
  isLoading?: boolean; // For disabled state (includes success states)
  isGranting?: boolean; // For Grant Permissions spinner/text
  isUnpermitting?: boolean; // For Unpermit button spinner/text
  error?: string | null;
  hasConfigurablePolicies?: boolean;
}

export function UserPermissionButtons({
  onUnpermit,
  onSubmit,
  onBackToConsent,
  isLoading = false,
  isGranting = false,
  isUnpermitting = false,
  error,
  hasConfigurablePolicies = true,
}: UserPermissionButtonsProps) {
  return (
    <div className="space-y-2">
      {/* Back to Sign In button - only show when callback is provided */}
      {onBackToConsent && (
        <div className="flex justify-center mb-2">
          <Button
            variant="ghost"
            onClick={onBackToConsent}
            className={`px-4 py-2 ${theme.text} hover:bg-orange-500/10 flex items-center gap-2`}
            disabled={isLoading}
            style={fonts.heading}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-center gap-2">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-auto"
        >
          <Button
            variant="ghost"
            onClick={onUnpermit}
            className={`w-full sm:w-auto px-6 py-2 border ${theme.cardBorder} ${theme.text} hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/30 flex items-center justify-center gap-2`}
            disabled={isLoading}
            style={fonts.heading}
          >
            {isUnpermitting && <Loader2 className="w-4 h-4 animate-spin -mt-px" />}
            <span className="leading-none">
              {isUnpermitting ? 'Unpermitting...' : 'Unpermit App'}
            </span>
          </Button>
        </motion.div>
        <motion.div
          whileHover={hasConfigurablePolicies ? { scale: 1.02 } : {}}
          whileTap={hasConfigurablePolicies ? { scale: 0.98 } : {}}
          className="w-full sm:w-auto"
        >
          <Button
            onClick={onSubmit}
            className={`w-full sm:w-auto px-6 py-2 ${error ? 'bg-red-500/20 border-red-500/30 text-red-400' : hasConfigurablePolicies ? `${theme.accentBg} ${theme.accentHover}` : 'bg-gray-500/20 border-gray-500/30 text-gray-400 cursor-not-allowed'} border-0 flex items-center justify-center gap-2`}
            disabled={isLoading || !hasConfigurablePolicies}
            style={fonts.heading}
          >
            {isGranting && <Loader2 className="w-4 h-4 animate-spin -mt-px" />}
            {error && <AlertCircle className="w-4 h-4 -mt-px" />}
            <span className="leading-none">
              {error
                ? 'Retry'
                : isGranting
                  ? 'Processing...'
                  : hasConfigurablePolicies
                    ? 'Update Permissions'
                    : 'No Configurable Policies'}
            </span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
