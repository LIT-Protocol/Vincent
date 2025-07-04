import { Code, Sun, TrendingUp, Wrench, Moon, Shield, Layers } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '@/contexts/ThemeContext';

export function Header() {
  const { isDark, theme, setIsDark } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="relative group">
      <div
        className={`absolute inset-0 ${theme.glowColor} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-700`}
      ></div>
      <div
        className={`relative ${theme.cardBg} backdrop-blur-xl border ${theme.cardBorder} rounded-2xl p-2 ${theme.cardHoverBorder} transition-all duration-500`}
      >
        <div className="flex items-center justify-between">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/explorer/apps')}
              className={`group/tab flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'text-black bg-white/90' : 'text-white bg-black/90'} font-medium text-sm transition-all duration-300 hover:scale-105`}
            >
              <Layers className="w-4 h-4" />
              Apps
            </button>

            <button
              onClick={() => navigate('/explorer/tools')}
              className={`group/tab flex items-center gap-2 px-4 py-2 rounded-xl ${theme.iconColorMuted} hover:${theme.text} ${theme.buttonHover} font-medium text-sm transition-all duration-300 hover:scale-105`}
            >
              <Wrench className="w-4 h-4" />
              Tools
            </button>

            <button
              onClick={() => navigate('/explorer/policies')}
              className={`group/tab flex items-center gap-2 px-4 py-2 rounded-xl ${theme.iconColorMuted} hover:${theme.text} ${theme.buttonHover} font-medium text-sm transition-all duration-300 hover:scale-105`}
            >
              <Shield className="w-4 h-4" />
              Policies
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/user-dashboard')}
              className={`group/action flex items-center gap-2 px-4 py-2 rounded-xl ${theme.accentBg} ${theme.accentHover} font-medium text-sm transition-all duration-300 hover:scale-105`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Earn</span>
            </button>

            <button
              onClick={() => navigate('/developer-dashboard')}
              className={`group/action flex items-center gap-2 px-4 py-2 rounded-xl ${theme.accentBg} ${theme.accentHover} font-medium text-sm transition-all duration-300 hover:scale-105`}
            >
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">Build</span>
            </button>

            {/* Theme Toggle in Quick Actions */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`group/action relative w-10 h-10 rounded-xl ${theme.itemBg} border ${theme.cardBorder} ${theme.cardHoverBorder} transition-all duration-300 flex items-center justify-center hover:scale-105`}
            >
              {isDark ? (
                <Moon
                  className={`w-4 h-4 ${theme.iconColorMuted} group-hover/action:${theme.iconColor} transition-colors duration-300`}
                />
              ) : (
                <Sun
                  className={`w-4 h-4 ${theme.iconColorMuted} group-hover/action:${theme.iconColor} transition-colors duration-300`}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
