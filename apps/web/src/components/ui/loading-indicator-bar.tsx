import { cn } from '@/lib/utils';

interface LoadingIndicatorBarProps {
  className?: string;
}

export const LoadingIndicatorBar = ({ className }: LoadingIndicatorBarProps) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-[80] h-1 overflow-hidden',
        className,
      )}
    >
      <div className="loading-indicator-bar h-full w-[38%] rounded-r-full bg-gradient-to-r from-brand via-[#67c4b7] to-[#cce9e2] shadow-[0_0_28px_rgba(15,123,113,0.32)]" />
    </div>
  );
};
