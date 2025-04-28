import { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function UserLayout({ children, className }: ComponentProps<'div'>) {
  return (
    <div className={cn('min-h-screen min-w-screen flex flex-col align-center', className)}>
      <main className="min-h-screen mx-auto flex flex-col align-center max-w-screen-xl xl:w-screen p-8">{children}</main>
    </div>
  );
}

export default UserLayout;
