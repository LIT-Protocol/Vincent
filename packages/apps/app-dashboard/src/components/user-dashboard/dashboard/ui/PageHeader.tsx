import React from 'react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { ExternalLink } from 'lucide-react';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  linkUrl?: string;
  linkText?: string;
}

export function PageHeader({ icon, title, description, linkUrl, linkText = 'Open App' }: PageHeaderProps) {
  return (
    <div className={`px-3 sm:px-4 py-3 border-b ${theme.cardBorder}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div
              className={`w-8 h-8 rounded-full ${theme.accentBg} flex items-center justify-center`}
            >
              {icon}
            </div>
          </div>
          <div>
            <h1 className={`text-lg font-bold ${theme.text}`}>{title}</h1>
            <p className={`text-xs ${theme.textMuted}`}>{description}</p>
          </div>
        </div>
        {linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 !text-orange-600 hover:!text-orange-700 font-medium text-sm underline"
          >
            <ExternalLink className="w-4 h-4 text-orange-600" />
            {linkText}
          </a>
        )}
      </div>
    </div>
  );
}
