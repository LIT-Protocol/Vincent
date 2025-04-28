import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

const spinnerVariants = cva('inline-block animate-spin', {
  variants: {
    variant: {
      default: 'text-primary',
      secondary: 'text-secondary',
      destructive: 'text-destructive',
      outline: 'text-foreground',
    },
    size: {
      sm: 'w-4 h-4',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

interface SpinnerProps
  extends React.ComponentPropsWithoutRef<'svg'>,
    VariantProps<typeof spinnerVariants> {
  thickness?: 'thin' | 'regular' | 'thick';
}

const thicknessMap = {
  thin: 2,
  regular: 3,
  thick: 4,
};

function Spinner({ className, variant, size, thickness = 'regular', ...props }: SpinnerProps) {
  return (
    <LoaderCircle
      data-slot="spinner"
      className={cn(spinnerVariants({ variant, size, className }))}
      strokeWidth={thicknessMap[thickness]}
      {...props}
    />
  );
}

export { Spinner, spinnerVariants };
