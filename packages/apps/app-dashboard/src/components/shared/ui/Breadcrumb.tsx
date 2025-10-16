import { ArrowLeft } from 'lucide-react';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Shared breadcrumb component for page navigation.
 * Used across multiple pages for consistent navigation.
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mb-6">
      {items.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            {isFirst && item.onClick ? (
              <button
                onClick={item.onClick}
                className={`flex items-center gap-2 ${theme.textMuted} hover:${theme.text} transition-colors`}
                style={fonts.heading}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ) : isLast ? (
              <span className={`text-sm font-medium ${theme.text}`} style={fonts.heading}>
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                className={`text-sm font-medium ${theme.textMuted} hover:${theme.text} transition-colors`}
                style={fonts.heading}
              >
                {item.label}
              </button>
            )}
            {!isLast && <span className={`${theme.textMuted}`}>/</span>}
          </div>
        );
      })}
    </div>
  );
}
