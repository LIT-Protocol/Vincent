import * as React from 'react';

import { cn } from '@/lib/utils';

function Box({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="box"
      className={cn('bg-card text-card-foreground flex flex-col gap-6 py-6', className)}
      {...props}
    />
  );
}

function BoxHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="box-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  );
}

function BoxTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="box-title" className={cn('leading-none font-semibold', className)} {...props} />
  );
}

function BoxDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="box-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function BoxAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="box-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function BoxContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="box-content" className={cn('px-6', className)} {...props} />;
}

function BoxFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="box-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  );
}

export { Box, BoxHeader, BoxFooter, BoxTitle, BoxAction, BoxDescription, BoxContent };
