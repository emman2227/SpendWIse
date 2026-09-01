import Image from 'next/image';

import { cn } from '@/lib/utils';

interface AppLogoProps {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
}

export const AppLogo = ({
  size = 32,
  width,
  height,
  className,
  priority = false,
  alt = 'SpendWise Logo',
}: AppLogoProps) => {
  const w = width ?? size;
  const h = height ?? size;

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden',
        className,
      )}
      style={{ width: w, height: h }}
    >
      {/* Light Mode Logo */}
      <Image
        src="/logo-light.png"
        alt={alt}
        width={w}
        height={h}
        priority={priority}
        className="app-logo-light h-full w-full object-cover"
      />

      {/* Dark Mode Logo */}
      <Image
        src="/logo-dark.png"
        alt={alt}
        width={w}
        height={h}
        priority={priority}
        className="app-logo-dark h-full w-full object-cover"
      />
    </div>
  );
};
