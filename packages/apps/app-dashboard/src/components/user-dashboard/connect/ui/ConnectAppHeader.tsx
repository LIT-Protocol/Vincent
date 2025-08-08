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
      className="rounded-xl p-2 sm:p-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div
          className={`p-3 sm:p-4 rounded-2xl ${theme.iconBg} border ${theme.iconBorder} flex-shrink-0`}
        >
          <Logo logo={app.logo} alt={app.name} className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className={`text-lg sm:text-xl font-bold ${theme.text}`}>{app.name}</h2>
          {app.description && (
            <p className={`text-sm sm:text-base ${theme.textMuted} mt-1`}>{app.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
