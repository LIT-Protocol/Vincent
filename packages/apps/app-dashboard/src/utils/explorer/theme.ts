export interface ExplorerTheme {
  bg: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  cardBg: string;
  cardBorder: string;
  cardHoverBorder: string;
  itemBg: string;
  itemHoverBg: string;
  itemBorder: string;
  itemHoverBorder: string;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  iconColorMuted: string;
  buttonHover: string;
  accentBg: string;
  accentHover: string;
  glowColor: string;
  glowOpacity: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  linkColor: string;
  linkUnderline: string;
  buttonBg: string;
  buttonSecondary: string;
  codeBlock: string;
}

export const explorerTheme = (isDark: boolean) => ({
  bg: isDark ? 'bg-black' : 'bg-white',
  text: isDark ? 'text-white' : 'text-black',
  textMuted: isDark ? 'text-gray-400' : 'text-gray-600',
  textSubtle: isDark ? 'text-gray-500' : 'text-gray-500',
  cardBg: isDark ? 'bg-black/40' : 'bg-white/40',
  cardBorder: isDark ? 'border-white/10' : 'border-black/10',
  cardHoverBorder: isDark ? 'hover:border-white/20' : 'hover:border-black/20',
  itemBg: isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]',
  itemHoverBg: isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-black/[0.05]',
  itemBorder: isDark ? 'border-white/5' : 'border-black/5',
  itemHoverBorder: isDark ? 'hover:border-white/10' : 'hover:border-black/10',
  iconBg: isDark ? 'bg-white/5' : 'bg-black/5',
  iconBorder: isDark ? 'border-white/10' : 'border-black/10',
  iconColor: isDark ? 'text-white/60' : 'text-black/60',
  iconColorMuted: isDark ? 'text-white/40' : 'text-black/40',
  buttonHover: isDark ? 'hover:bg-white/5' : 'hover:bg-black/5',
  accentBg: isDark ? 'bg-white text-black' : 'bg-black text-white',
  accentHover: isDark ? 'hover:bg-white/90' : 'hover:bg-black/90',
  glowColor: isDark ? 'bg-white/5' : 'bg-black/5',
  glowOpacity: isDark ? 'bg-white/20' : 'bg-black/20',
  inputBg: isDark ? 'bg-white/[0.05]' : 'bg-black/[0.05]',
  inputBorder: isDark ? 'border-white/10' : 'border-black/10',
  inputFocus: isDark ? 'focus:border-white/20' : 'focus:border-black/20',
  linkColor: isDark
    ? 'text-white hover:text-gray-200 no-underline'
    : 'text-black hover:text-gray-800 no-underline',
  linkUnderline: isDark ? 'hover:text-white no-underline' : 'hover:text-black no-underline',
  buttonBg: isDark ? 'bg-white text-black' : 'bg-black text-white',
  buttonSecondary: isDark
    ? 'bg-transparent border-white text-white hover:bg-white/10'
    : 'bg-transparent border-black text-black hover:bg-black/10',
  codeBlock: isDark ? 'bg-gray-900/50' : 'bg-gray-100/50',
});
