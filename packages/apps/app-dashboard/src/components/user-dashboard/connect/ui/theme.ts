// Native Tailwind theme classes - no props needed, uses dark: prefix
export const theme = {
  bg: 'bg-white dark:bg-gray-950',
  text: 'text-gray-900 dark:text-white',
  textMuted: 'text-gray-600 dark:text-white/60',
  textSubtle: 'text-gray-500 dark:text-white/40',
  cardBg: 'bg-white dark:bg-black',
  cardBorder: 'border-gray-200 dark:border-white/10',
  cardHoverBorder: 'hover:border-gray-300 dark:hover:border-white/20',
  itemBg: 'bg-gray-100/50 dark:bg-white/[0.02]',
  itemHoverBg: 'hover:bg-gray-100 dark:hover:bg-white/[0.05]',
  iconBg: 'bg-gray-200/50 dark:bg-white/5',
  iconBorder: 'border-gray-300 dark:border-white/10',
  accentBg: 'bg-neutral-900 text-white dark:bg-white dark:text-black',
  accentHover: 'hover:bg-neutral-800 dark:hover:bg-gray-100',
  warningBg: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-500/10 dark:border-yellow-500/30',
  warningText: 'text-yellow-700 dark:text-yellow-400',
  successBg: 'bg-emerald-50 border-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/40',
  successText: 'text-emerald-800 dark:text-emerald-300',
  errorBg: 'bg-red-50 border-red-300 dark:bg-red-500/10 dark:border-red-500/30',
  errorText: 'text-red-700 dark:text-red-400',
  infoBg: 'bg-blue-50 border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/30',
  infoText: 'text-blue-700 dark:text-blue-400',
  mainCard: 'bg-white dark:bg-gray-950',
  mainCardBorder: 'border-gray-200 dark:border-white/10',
  linkColor: 'text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300',
  brandOrange: '#FF4205',
  brandOrangeDarker: '#E03A04',
};

// Font families as style objects for inline styles
export const fonts = {
  heading: {
    fontFamily: "'Glacial Indifference', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  body: {
    fontFamily:
      "'Encode Sans Semi Expanded', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
} as const;

export type ThemeType = typeof theme;
