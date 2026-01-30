import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { theme } from '@/lib/themeClasses';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  iconSize?: string;
  orangeIcon?: boolean;
}

export function CopyButton({
  textToCopy,
  className = '',
  iconSize = 'w-4 h-4',
  orangeIcon = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const iconColor = orangeIcon ? theme.brandOrange : theme.textMuted;
  const hoverBg = orangeIcon ? 'hover:bg-orange-500/10' : `hover:${theme.itemHoverBg}`;

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 sm:p-2 rounded-lg ${hoverBg} transition-colors flex-shrink-0 ${className}`}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check
          className={`${iconSize}`}
          style={orangeIcon ? { color: theme.brandOrange } : undefined}
        />
      ) : (
        <Copy
          className={`${iconSize} ${orangeIcon ? '' : iconColor}`}
          style={orangeIcon ? { color: theme.brandOrange } : undefined}
        />
      )}
    </button>
  );
}
