import { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function AppLayout({ children, className }: ComponentProps<'div'>) {
  return <div className={cn('min-h-screen min-w-screen bg-gray-50', className)}>{children}</div>;
}

export default AppLayout;
