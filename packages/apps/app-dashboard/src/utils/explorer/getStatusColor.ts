export const getStatusColor = (isDark: boolean, status?: string) => {
  if (isDark) {
    switch (status) {
      case 'prod':
        return 'border-green-400/40 bg-green-400/10 text-green-400';
      case 'test':
        return 'border-yellow-400/40 bg-yellow-400/10 text-yellow-400';
      default:
        return 'border-white/20 bg-white/5 text-white/60';
    }
  } else {
    switch (status) {
      case 'prod':
        return 'border-green-600/40 bg-green-600/10 text-green-600';
      case 'test':
        return 'border-yellow-600/40 bg-yellow-600/10 text-yellow-600';
      default:
        return 'border-black/20 bg-black/5 text-black/60';
    }
  }
};

export const getVersionStatusColor = (isDark: boolean, enabled: boolean) => {
  if (isDark) {
    return enabled ? 'border-white/40 bg-white/10' : 'border-white/10 bg-white/5';
  } else {
    return enabled ? 'border-black/40 bg-black/10' : 'border-black/10 bg-black/5';
  }
};
