import { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function UserLayout({ children, className }: ComponentProps<'div'>) {
  return (
    <div className={cn('min-h-screen flex flex-col', className)}>
      <main className="min-h-screen mx-auto flex flex-col justify-center items-center w-full max-w-none p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}

export default UserLayout;
