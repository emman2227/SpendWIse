import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-ink text-white shadow-sm hover:-translate-y-0.5 hover:bg-slate-900',
        secondary: 'bg-brand text-white shadow-sm hover:-translate-y-0.5 hover:bg-[#0b645b]',
        soft: 'border border-white/70 bg-white/90 text-ink shadow-sm hover:border-line hover:bg-white',
        outline:
          'border border-line bg-transparent text-ink hover:border-brand hover:bg-white/60 hover:text-brand',
        ghost: 'text-slate-700 hover:bg-white/60',
        danger: 'bg-danger text-white hover:bg-[#b85f4c]',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 px-4 text-[13px]',
        lg: 'h-12 px-6 text-sm',
        icon: 'h-11 w-11 rounded-[18px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
