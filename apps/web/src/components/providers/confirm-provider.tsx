'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

import {
  type ConfirmationIcon,
  ConfirmationModal,
  type ConfirmationVariant,
} from '@/components/ui/confirmation-modal';

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  icon?: ConfirmationIcon;
}

export interface ConfirmDeleteOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  itemName?: string;
}

export interface ConfirmSaveOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  itemName?: string;
}

export interface ConfirmLogoutOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  confirmDelete: (options?: ConfirmDeleteOptions) => Promise<boolean>;
  confirmSave: (options?: ConfirmSaveOptions) => Promise<boolean>;
  confirmLogout: (options?: ConfirmLogoutOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: 'Are you sure?',
    description: 'Please confirm your action.',
    variant: 'brand',
  });
  const [isConfirming, setIsConfirming] = useState(false);

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((newOptions: ConfirmOptions): Promise<boolean> => {
    setOptions(newOptions);
    setIsConfirming(false);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const confirmDelete = useCallback(
    (deleteOptions?: ConfirmDeleteOptions): Promise<boolean> => {
      const itemName = deleteOptions?.itemName ? ` "${deleteOptions.itemName}"` : '';
      return confirm({
        title: deleteOptions?.title ?? `Delete${itemName ? itemName : ' item'}?`,
        description:
          deleteOptions?.description ??
          `Are you sure you want to permanently delete this${itemName}? This action cannot be undone.`,
        confirmText: deleteOptions?.confirmText ?? 'Delete',
        cancelText: deleteOptions?.cancelText ?? 'Cancel',
        variant: 'danger',
        icon: 'trash',
      });
    },
    [confirm],
  );

  const confirmSave = useCallback(
    (saveOptions?: ConfirmSaveOptions): Promise<boolean> => {
      const itemName = saveOptions?.itemName ? ` ${saveOptions.itemName}` : '';
      return confirm({
        title: saveOptions?.title ?? `Save changes${itemName}?`,
        description:
          saveOptions?.description ??
          `Are you sure you want to save the updated details for this${itemName || ' record'}?`,
        confirmText: saveOptions?.confirmText ?? 'Save changes',
        cancelText: saveOptions?.cancelText ?? 'Cancel',
        variant: 'brand',
        icon: 'save',
      });
    },
    [confirm],
  );

  const confirmLogout = useCallback(
    (logoutOptions?: ConfirmLogoutOptions): Promise<boolean> => {
      return confirm({
        title: logoutOptions?.title ?? 'Log out of SpendWise?',
        description:
          logoutOptions?.description ??
          'Are you sure you want to end your session? You will need to log back in to access your workspace.',
        confirmText: logoutOptions?.confirmText ?? 'Log out',
        cancelText: logoutOptions?.cancelText ?? 'Stay logged in',
        variant: 'danger',
        icon: 'logout',
      });
    },
    [confirm],
  );

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm, confirmDelete, confirmSave, confirmLogout }}>
      {children}
      <ConfirmationModal
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        description={options.description}
        icon={options.icon}
        isConfirming={isConfirming}
        isOpen={isOpen}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        title={options.title}
        variant={options.variant}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmContextType => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
