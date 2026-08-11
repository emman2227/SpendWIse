import * as React from 'react';

import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-12 w-full rounded-[20px] border border-line bg-paper px-4 text-sm text-ink shadow-sm outline-none transition placeholder:text-ink-soft focus:border-brand focus:bg-paper-strong',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
