import { motion } from 'framer-motion';
import { Button } from '@/components/shared/ui/button';
import { AlertCircle, Loader2, Shield } from 'lucide-react';
import { theme } from './theme';

interface ActionButtonsProps {
  appName: string;
  onDecline: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ActionButtons({
  appName,
  onDecline,
  onSubmit,
  isLoading = false,
  error,
}: ActionButtonsProps) {
  return (
    <div className="space-y-4">
      {/* Trust Warning */}
      <div className="flex items-start gap-2 text-center justify-center">
        <Shield className={`w-4 h-4 ${theme.textMuted} mt-0.5 flex-shrink-0`} />
        <p className={`text-sm ${theme.textSubtle} leading-relaxed`}>
          Make sure you trust <span className={`font-medium ${theme.text}`}>{appName}</span>. By
          connecting, you may be sharing sensitive account permissions.
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
            disabled={isLoading}
          >
            Decline
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
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {error && <AlertCircle className="w-4 h-4" />}
            {error ? 'Retry' : isLoading ? 'Processing...' : 'Grant Permissions'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
