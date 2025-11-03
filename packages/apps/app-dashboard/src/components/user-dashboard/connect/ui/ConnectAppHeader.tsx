import { motion } from 'framer-motion';
import { theme, fonts } from './theme';
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
        <div className={`p-2 rounded-2xl ${theme.iconBg} border ${theme.iconBorder} flex-shrink-0`}>
          <Logo
            logo={app.logo}
            alt={app.name}
            className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
          />
        </div>
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h2 className={`text-lg sm:text-xl font-bold ${theme.text} break-words`}>{app.name}</h2>
          {app.description && (
            <p
              className={`text-xs sm:text-sm ${theme.textMuted} mt-1 break-words line-clamp-3`}
              style={{ ...fonts.body, wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            >
              {app.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
