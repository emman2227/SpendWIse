import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
  compact?: boolean;
  alwaysShow?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className,
  compact = false,
  alwaysShow = false,
}) => {
  if (!alwaysShow && totalPages <= 1) {
    return null;
  }

  const startItem = pageSize ? (currentPage - 1) * pageSize + 1 : undefined;
  const endItem =
    pageSize && totalItems !== undefined ? Math.min(currentPage * pageSize, totalItems) : undefined;

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex items-center justify-between gap-3 pt-3',
        compact && 'pt-2.5 text-xs',
        className,
      )}
    >
      <div className="text-xs font-medium text-ink-soft">
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Showing <span className="font-semibold text-ink">{startItem}</span>-
            <span className="font-semibold text-ink">{endItem}</span> of{' '}
            <span className="font-semibold text-ink">{totalItems}</span>
          </span>
        ) : (
          <span>
            Page <span className="font-semibold text-ink">{currentPage}</span> of{' '}
            <span className="font-semibold text-ink">{totalPages}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          aria-label="Previous page"
          className="h-8 w-8 rounded-full p-0"
          disabled={!canGoPrev}
          onClick={() => onPageChange(currentPage - 1)}
          size="icon"
          type="button"
          variant="soft"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="px-1 text-xs font-medium text-ink-soft">
          {currentPage} / {totalPages}
        </div>
        <Button
          aria-label="Next page"
          className="h-8 w-8 rounded-full p-0"
          disabled={!canGoNext}
          onClick={() => onPageChange(currentPage + 1)}
          size="icon"
          type="button"
          variant="soft"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
};
