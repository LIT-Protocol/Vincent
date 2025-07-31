import React from 'react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function PageHeader({ icon, title, description }: PageHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b ${theme.cardBorder}`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div
            className={`w-8 h-8 rounded-full ${theme.accentBg} flex items-center justify-center`}
          >
            {icon}
          </div>
        </div>
        <div>
          <h1 className={`text-xl font-bold ${theme.text}`}>{title}</h1>
          <p className={`text-sm ${theme.textMuted}`}>{description}</p>
        </div>
      </div>
    </div>
  );
}
