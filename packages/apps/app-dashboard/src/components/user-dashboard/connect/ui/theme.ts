// Native Tailwind theme classes - no props needed, uses dark: prefix
export const theme = {
  bg: 'bg-white dark:bg-neutral-950',
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
  successBg: 'bg-green-50 border-green-300 dark:bg-green-500/10 dark:border-green-500/30',
  successText: 'text-green-700 dark:text-green-400',
  mainCard: 'bg-white dark:bg-neutral-900',
  mainCardBorder: 'border-gray-200 dark:border-white/10',
  linkColor: 'text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300',
};

export type ThemeType = typeof theme;
