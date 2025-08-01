export const theme = (isDark: boolean) => {
  return {
    bg: isDark ? 'bg-black' : 'bg-gray-50',
    text: isDark ? 'text-white' : 'text-gray-900',
    textMuted: isDark ? 'text-white/60' : 'text-gray-600',
    textSubtle: isDark ? 'text-white/40' : 'text-gray-500',
    cardBg: isDark ? 'bg-black/40' : 'bg-white/80',
    cardBorder: isDark ? 'border-white/10' : 'border-gray-200',
    cardHoverBorder: isDark ? 'hover:border-white/20' : 'hover:border-gray-300',
    itemBg: isDark ? 'bg-white/[0.02]' : 'bg-gray-100/50',
    itemHoverBg: isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-100',
    iconBg: isDark ? 'bg-white/5' : 'bg-gray-200/50',
    iconBorder: isDark ? 'border-white/10' : 'border-gray-300',
    accentBg: isDark ? 'bg-white text-black' : 'bg-gray-900 text-white',
    accentHover: isDark ? 'hover:bg-gray-100' : 'hover:bg-gray-800',
    warningBg: isDark ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-300',
    warningText: isDark ? 'text-yellow-400' : 'text-yellow-700',
    successBg: isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-300',
    successText: isDark ? 'text-green-400' : 'text-green-700',
    mainCard: isDark ? 'bg-gray-900' : 'bg-white',
    mainCardBorder: isDark ? 'border-white/10' : 'border-gray-200',
    linkColor: isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500',
  };
};

export type ThemeType = ReturnType<typeof theme>;
