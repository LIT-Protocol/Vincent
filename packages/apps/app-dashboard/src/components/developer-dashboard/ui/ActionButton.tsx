import { ChevronRight, LucideIcon } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { fonts, theme } from '@/lib/themeClasses';

interface ActionButtonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: 'success' | 'danger' | 'default' | 'orange';
  borderColor?: string;
  hoverBorderColor?: string;
  iconBg?: string;
  iconColor?: string;
  textColor?: string;
  className?: string;
}

const variantStyles = {
  success: {
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-700 dark:text-green-400',
    textColor: 'text-green-700 dark:text-green-400',
    textMuted: 'text-green-700/70 dark:text-green-400/70',
  },
  danger: {
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-700 dark:text-red-400',
    textColor: 'text-red-700 dark:text-red-400',
    textMuted: 'text-red-700/70 dark:text-red-400/70',
  },
  orange: {
    iconBg: '',
    iconColor: '',
    textColor: '',
    textMuted: '',
  },
  default: {
    iconBg: 'bg-gray-100 dark:bg-gray-700',
    iconColor: 'text-gray-700 dark:text-gray-400',
    textColor: 'text-gray-700 dark:text-gray-400',
    textMuted: 'text-gray-700/70 dark:text-gray-400/70',
  },
};

export function ActionButton({
  icon: Icon,
  title,
  description,
  onClick,
  disabled = false,
  isLoading = false,
  variant = 'default',
  borderColor,
  hoverBorderColor,
  iconBg: customIconBg,
  iconColor: customIconColor,
  textColor: customTextColor,
  className,
}: ActionButtonProps) {
  const styles = variantStyles[variant];
  const isOrangeVariant = variant === 'orange';

  return (
    <DashboardCard
      onClick={onClick}
      disabled={disabled || isLoading}
      borderColor={borderColor}
      hoverBorderColor={hoverBorderColor}
      className={className}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-2" />
            <div className="h-3 w-40 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${customIconBg || (isOrangeVariant ? 'bg-orange-100 dark:bg-orange-900/30' : styles.iconBg)}`}
                style={
                  customIconBg || isOrangeVariant
                    ? { backgroundColor: customIconBg || `${theme.brandOrange}1A` }
                    : undefined
                }
              >
                <Icon
                  className={`h-4 w-4 ${!isOrangeVariant && !customIconColor ? styles.iconColor : ''}`}
                  style={
                    customIconColor || isOrangeVariant
                      ? { color: customIconColor || theme.brandOrange }
                      : undefined
                  }
                />
              </div>
              <h5
                className={`font-semibold ${!isOrangeVariant && !customTextColor ? styles.textColor : ''}`}
                style={{
                  ...fonts.heading,
                  color: customTextColor || (isOrangeVariant ? theme.brandOrange : undefined),
                }}
              >
                {title}
              </h5>
            </div>
            <p
              className={`text-xs mt-1 ${isOrangeVariant ? theme.textMuted : styles.textMuted}`}
              style={fonts.body}
            >
              {description}
            </p>
          </div>
          <ChevronRight
            className={`h-4 w-4 group-hover:translate-x-1 transition-transform ${!isOrangeVariant ? styles.iconColor || 'text-gray-400 dark:text-gray-500' : ''}`}
            style={isOrangeVariant ? { color: theme.brandOrange } : undefined}
          />
        </div>
      )}
    </DashboardCard>
  );
}
