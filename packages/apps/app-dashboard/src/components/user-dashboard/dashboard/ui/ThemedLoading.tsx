import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '@/components/user-dashboard/consent/ui/theme';

export function ThemedLoading() {
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);

  return (
    <div className={`min-h-screen min-w-screen flex items-center justify-center ${themeStyles.bg}`}>
      <div className="text-center">
        <div className="mb-4">
          <img
            src={isDark ? '/vincent-by-lit-white-logo.png' : '/vincent-by-lit-logo.png'}
            alt="Vincent by Lit Protocol"
            className="h-12 mx-auto opacity-80"
          />
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className={`text-lg font-medium ${themeStyles.text}`}>Loading</span>
          <div className="flex gap-1">
            <span
              className={`w-1 h-1 bg-current rounded-full ${themeStyles.text} animate-bounce`}
              style={{ animationDelay: '0ms' }}
            />
            <span
              className={`w-1 h-1 bg-current rounded-full ${themeStyles.text} animate-bounce`}
              style={{ animationDelay: '150ms' }}
            />
            <span
              className={`w-1 h-1 bg-current rounded-full ${themeStyles.text} animate-bounce`}
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
