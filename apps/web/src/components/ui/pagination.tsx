import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  itemLabel?: string;
  className?: string;
  compact?: boolean;
  alwaysShow?: boolean;
}

function getPageRange(
  currentPage: number,
  totalPages: number,
): (number | 'ellipsis-start' | 'ellipsis-end')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  // When near the start: 1, 2, 3, 4, 5, ..., totalPages
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-end', totalPages];
  }

  // When near the end: 1, ..., totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages
  if (currentPage >= totalPages - 3) {
    return [
      1,
      'ellipsis-start',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  // When in the middle: 1, ..., currentPage - 1, currentPage, currentPage + 1, ..., totalPages
  return [
    1,
    'ellipsis-start',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis-end',
    totalPages,
  ];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  itemLabel = 'items',
  className,
  compact = false,
  alwaysShow = false,
}) => {
  const safeTotalPages = Math.max(1, totalPages);
  const validCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const pageRange = useMemo(
    () => getPageRange(validCurrentPage, safeTotalPages),
    [validCurrentPage, safeTotalPages],
  );

  if (!alwaysShow && safeTotalPages <= 1) {
    return null;
  }

  const startItem =
    pageSize && totalItems !== undefined && totalItems > 0
      ? (validCurrentPage - 1) * pageSize + 1
      : pageSize
        ? (validCurrentPage - 1) * pageSize + 1
        : undefined;

  const endItem =
    pageSize && totalItems !== undefined
      ? Math.min(validCurrentPage * pageSize, totalItems)
      : undefined;

  const canGoPrev = validCurrentPage > 1;
  const canGoNext = validCurrentPage < safeTotalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex flex-col items-center justify-between gap-3 sm:flex-row',
        compact ? 'pt-2 text-xs' : 'pt-3 text-xs sm:text-sm',
        className,
      )}
    >
      <p className="text-xs text-ink-soft">
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <>
            Showing <span className="font-medium text-ink">{startItem}</span> to{' '}
            <span className="font-medium text-ink">{endItem}</span> of{' '}
            <span className="font-medium text-ink">{totalItems}</span> {itemLabel}
          </>
        ) : (
          <>
            Page <span className="font-medium text-ink">{validCurrentPage}</span> of{' '}
            <span className="font-medium text-ink">{safeTotalPages}</span>
          </>
        )}
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          aria-label="Previous page"
          className={cn(compact && 'h-7 px-2 text-xs')}
          disabled={!canGoPrev}
          onClick={() => onPageChange(validCurrentPage - 1)}
          size="sm"
          type="button"
          variant="soft"
        >
          <ChevronLeft className="h-4 w-4" />
          {!compact && <span>Previous</span>}
        </Button>

        <div className="flex items-center gap-1 px-1 sm:px-2">
          {pageRange.map((item, index) => {
            if (typeof item === 'string') {
              return (
                <span
                  key={`${item}-${index}`}
                  className="flex h-8 w-6 select-none items-center justify-center text-xs font-semibold text-ink-soft/60"
                >
                  &hellip;
                </span>
              );
            }
            const pageNum = item;
            const isActive = validCurrentPage === pageNum;
            return (
              <button
                key={pageNum}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${pageNum}`}
                className={cn(
                  'h-8 w-8 cursor-pointer rounded-xl text-xs font-semibold transition',
                  isActive
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-ink-soft hover:bg-paper-strong hover:text-ink',
                  compact && 'h-7 w-7 text-[11px]',
                )}
                onClick={() => onPageChange(pageNum)}
                type="button"
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <Button
          aria-label="Next page"
          className={cn(compact && 'h-7 px-2 text-xs')}
          disabled={!canGoNext}
          onClick={() => onPageChange(validCurrentPage + 1)}
          size="sm"
          type="button"
          variant="soft"
        >
          {!compact && <span>Next</span>}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
};
