import { motion } from 'framer-motion';
import { Button } from '@/components/shared/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { fonts, theme } from './theme';

interface ActionButtonsProps {
  appName: string;
  onDecline: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  error?: string | null;
  submitText?: string;
  declineText?: string;
}

export function ActionButtons({
  appName,
  onDecline,
  onSubmit,
  isLoading = false,
  error,
  submitText = 'Grant Permissions',
  declineText = 'Decline',
}: ActionButtonsProps) {
  return (
    <div className="space-y-4">
      {/* Trust Warning */}
      <div className="flex justify-center text-center">
        <p className={`text-sm ${theme.textSubtle} leading-relaxed`} style={fonts.body}>
          Make sure you trust <span className={`font-medium ${theme.text}`}>{appName}</span>.
          <br />
          By connecting, you may be sharing sensitive account permissions.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-auto"
        >
          <Button
            variant="ghost"
            onClick={onDecline}
            className={`w-full sm:w-auto px-6 py-2 border ${theme.cardBorder} ${theme.text} hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/30`}
            style={fonts.heading}
            disabled={isLoading}
          >
            {declineText}
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-auto"
        >
          <Button
            onClick={onSubmit}
            className={`w-full sm:w-auto px-6 py-2 ${error ? 'bg-red-500/20 border-red-500/30 text-red-400' : `${theme.accentBg} ${theme.accentHover}`} border-0 flex items-center justify-center gap-2`}
            style={fonts.heading}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {error && <AlertCircle className="w-4 h-4" />}
            {error ? 'Retry' : isLoading ? 'Processing...' : submitText}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
