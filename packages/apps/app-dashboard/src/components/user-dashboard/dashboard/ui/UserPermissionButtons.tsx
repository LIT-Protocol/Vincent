import { motion } from 'framer-motion';
import { Button } from '@/components/shared/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ThemeType } from '@/components/user-dashboard/connect/ui/theme';

interface UserPermissionButtonsProps {
  theme: ThemeType;
  onUnpermit?: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function UserPermissionButtons({
  theme,
  onUnpermit,
  onSubmit,
  isLoading = false,
  error,
}: UserPermissionButtonsProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-auto"
        >
          <Button
            variant="ghost"
            onClick={onUnpermit}
            className={`w-full sm:w-auto px-6 py-2 border ${theme.cardBorder} ${theme.text} hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/30`}
            disabled={isLoading}
          >
            Unpermit App
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
