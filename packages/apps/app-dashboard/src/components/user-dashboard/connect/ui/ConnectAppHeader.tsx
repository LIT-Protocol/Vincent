import { motion } from 'framer-motion';
import { theme } from './theme';
import { App } from '@/types/developer-dashboard/appTypes';
import { Logo } from '@/components/shared/ui/Logo';

interface ConnectAppHeaderProps {
  app: App;
}

export function ConnectAppHeader({ app }: ConnectAppHeaderProps) {
  return (
    <motion.div
      className="rounded-xl p-4 sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div
          className={`p-3 sm:p-4 rounded-2xl ${theme.iconBg} border ${theme.iconBorder} flex-shrink-0`}
        >
          <Logo logo={app.logo} alt={app.name} className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className={`text-xl sm:text-2xl font-bold ${theme.text}`}>{app.name}</h2>
          {app.description && (
            <p className={`text-base sm:text-lg ${theme.textMuted} mt-1`}>{app.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
