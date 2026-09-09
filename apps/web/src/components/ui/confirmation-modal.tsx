'use client';

import { AlertTriangle, Check, CircleHelp, Info, LogOut, Save, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ConfirmationVariant = 'danger' | 'brand' | 'warning' | 'info';
export type ConfirmationIcon = 'trash' | 'save' | 'warning' | 'help' | 'info' | 'check' | 'logout';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  icon?: ConfirmationIcon;
  isConfirming?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const variantConfig: Record<
  ConfirmationVariant,
  {
    iconBg: string;
    iconColor: string;
    confirmButtonVariant: 'danger' | 'secondary' | 'default';
    defaultIcon: 'trash' | 'save' | 'warning' | 'info';
  }
> = {
  danger: {
    iconBg: 'bg-danger/10 border border-danger/20',
    iconColor: 'text-danger',
    confirmButtonVariant: 'danger',
    defaultIcon: 'trash',
  },
  brand: {
    iconBg: 'bg-brand/10 border border-brand/20',
    iconColor: 'text-brand',
    confirmButtonVariant: 'secondary',
    defaultIcon: 'save',
  },
  warning: {
    iconBg: 'bg-warning/10 border border-warning/20',
    iconColor: 'text-warning',
    confirmButtonVariant: 'secondary',
    defaultIcon: 'warning',
  },
  info: {
    iconBg: 'bg-paper-strong border border-line',
    iconColor: 'text-ink',
    confirmButtonVariant: 'default',
    defaultIcon: 'info',
  },
};

const iconMap = {
  trash: Trash2,
  save: Save,
  warning: AlertTriangle,
  help: CircleHelp,
  info: Info,
  check: Check,
  logout: LogOut,
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'brand',
  icon,
  isConfirming = false,
  onConfirm,
  onCancel,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard navigation and focus management
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!isConfirming) {
          onCancel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus cancel button on destructive modals to prevent accidental execution,
    // or confirm button for save modals.
    const timer = setTimeout(() => {
      if (variant === 'danger') {
        cancelButtonRef.current?.focus();
      } else {
        confirmButtonRef.current?.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, isConfirming, onCancel, variant]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!mounted || !isOpen) {
    return null;
  }

  const currentVariant = variantConfig[variant] ?? variantConfig.brand;
  const selectedIconKey = icon ?? currentVariant.defaultIcon;
  const IconComponent = iconMap[selectedIconKey] ?? iconMap.info;

  return createPortal(
    <div
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="alertdialog"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!isConfirming) {
            onCancel();
          }
        }}
      />

      {/* Modal Container */}
      <div
        className="relative z-10 flex max-h-[90dvh] w-full max-w-[460px] flex-col overflow-y-auto rounded-t-[28px] border border-line-strong bg-paper-strong p-5 shadow-lift transition-all animate-in fade-in duration-200 sm:rounded-[32px] sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          aria-label="Close dialog"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-[12px] border border-line bg-paper text-ink-soft transition hover:border-brand/40 hover:text-ink disabled:opacity-50 sm:right-5 sm:top-5 sm:h-9 sm:w-9 sm:rounded-[14px]"
          disabled={isConfirming}
          onClick={onCancel}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header with Icon */}
        <div className="flex items-start gap-3.5 pr-6 sm:gap-4 sm:pr-8">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm sm:h-12 sm:w-12',
              currentVariant.iconBg,
              currentVariant.iconColor,
            )}
          >
            <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          <div className="min-w-0 pt-0.5">
            <h3
              id="confirm-modal-title"
              className="text-base font-bold tracking-tight text-ink sm:text-xl"
            >
              {title}
            </h3>
            <p
              id="confirm-modal-description"
              className="mt-1.5 text-xs leading-relaxed text-ink-soft sm:mt-2 sm:text-sm"
            >
              {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col-reverse gap-2.5 border-t border-line/60 pt-4 sm:mt-7 sm:flex-row sm:items-center sm:justify-end [&>button]:w-full sm:[&>button]:w-auto">
          <Button
            ref={cancelButtonRef}
            disabled={isConfirming}
            onClick={onCancel}
            size="sm"
            type="button"
            variant="soft"
            className="h-10 rounded-full px-5"
          >
            {cancelText}
          </Button>

          <Button
            ref={confirmButtonRef}
            disabled={isConfirming}
            onClick={() => void onConfirm()}
            size="sm"
            type="button"
            variant={currentVariant.confirmButtonVariant}
            className="h-10 rounded-full px-5 shadow-sm"
          >
            {isConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Processing...</span>
              </span>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
