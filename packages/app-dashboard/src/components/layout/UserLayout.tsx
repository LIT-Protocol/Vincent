import { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function UserLayout({ children, className }: ComponentProps<'div'>) {
  return (
    <div className={cn('min-h-screen flex flex-col align-center', className)}>
      <main className="min-h-screen mx-auto flex flex-col align-center w-full max-w-screen-xl xl:w-screen p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}

export default UserLayout;
