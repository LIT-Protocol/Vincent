import { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import Header from './Header';

interface UserLayoutProps extends ComponentProps<'div'> {
  onSignOut?: () => void;
}

function UserLayout({ children, className, onSignOut }: UserLayoutProps) {
  return (
    <div className={cn('min-h-screen min-w-screen flex flex-col', className)}>
      <Header onSignOut={onSignOut} />
      <div className="flex-1 w-full bg-gray-50">
        <main className="mx-auto w-full max-w-screen-xl xl:w-screen p-8">{children}</main>
      </div>
    </div>
  );
}

export default UserLayout;
