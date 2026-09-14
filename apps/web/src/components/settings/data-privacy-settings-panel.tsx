'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Eraser,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SurfaceCard } from '@/components/ui/surface-card';
import { authQueryKey } from '@/lib/auth/client';
import { LOGOUT_INTENT_STORAGE_KEY } from '@/lib/auth/constants';
import { clearUserData, deleteAccount, exportUserData } from '@/lib/settings/client';

export function DataPrivacySettingsPanel() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Export State
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Clear Transactions Modal State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState('');
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);

  // Delete Account Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Handle real JSON export
  const handleExportJson = async () => {
    setIsExportingJson(true);
    setExportNotice(null);

    try {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `spendwise-data-export-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportNotice(
        `JSON data export complete (${data.expenses.length} expenses, ${data.budgets.length} budgets, ${data.goals.length} goals).`,
      );
    } catch (err) {
      setExportNotice(
        err instanceof Error ? err.message : 'Unable to export data. Please try again.',
      );
    } finally {
      setIsExportingJson(false);
    }
  };

  // Handle CSV export of expenses
  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    setExportNotice(null);

    try {
      const data = await exportUserData();
      const headers = [
        'ID',
        'Date',
        'Description',
        'Amount',
        'Category ID',
        'Payment Method',
        'Notes',
      ];
      const rows = data.expenses.map((e) => [
        `"${e.id}"`,
        `"${e.date}"`,
        `"${(e.description || '').replace(/"/g, '""')}"`,
        e.amount,
        `"${e.categoryId}"`,
        `"${e.paymentMethod}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `spendwise-expenses-${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportNotice(`CSV expenses export complete (${data.expenses.length} records).`);
    } catch (err) {
      setExportNotice(
        err instanceof Error ? err.message : 'Unable to export CSV. Please try again.',
      );
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Handle Clear Transaction Records
  const handleClearTransactions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clearConfirmText !== 'CLEAR' || !clearPassword) return;

    setIsClearing(true);
    setClearError('');

    try {
      const res = await clearUserData(clearPassword);
      setIsClearModalOpen(false);
      setClearPassword('');
      setClearConfirmText('');
      setClearSuccess(res.message || 'Transaction history cleared successfully.');
      void queryClient.invalidateQueries();
    } catch (err) {
      setClearError(
        err instanceof Error ? err.message : 'Failed to clear data. Verify your password.',
      );
    } finally {
      setIsClearing(false);
    }
  };

  // Handle Permanent Delete Account
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE' || !deletePassword) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteAccount(deletePassword);
      window.sessionStorage.setItem(LOGOUT_INTENT_STORAGE_KEY, 'manual');
      queryClient.setQueryData(authQueryKey, null);
      router.replace('/login?reason=account-deleted');
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Failed to delete account. Verify your password.',
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Export Section */}
      <SurfaceCard className="rounded-[32px] p-6 sm:p-8 md:p-9 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-brand/10 text-brand sm:h-16 sm:w-16 sm:rounded-[24px]">
            <Database className="h-7 w-7" />
          </div>
          <div>
            <p className="kicker">Data Portability</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Export Your Workspace Data
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft sm:text-sm sm:leading-6">
              Download your complete personal data at any time. You can export a comprehensive JSON
              snapshot or spreadsheet-ready CSV files.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {/* JSON Full Export Card */}
          <div className="flex flex-col justify-between rounded-[24px] border border-line bg-paper p-6">
            <div>
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-brand" />
                <h3 className="text-sm font-bold text-ink">Complete JSON Archive</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                Full export of your profile, notification preferences, expenses, budgets, goals, and
                custom categories.
              </p>
            </div>
            <Button
              className="mt-5 w-full gap-2 rounded-[18px] h-12"
              disabled={isExportingJson}
              onClick={handleExportJson}
              variant="secondary"
            >
              {isExportingJson ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Generating JSON...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download JSON Archive</span>
                </>
              )}
            </Button>
          </div>

          {/* CSV Spreadsheet Export Card */}
          <div className="flex flex-col justify-between rounded-[24px] border border-line bg-paper p-6">
            <div>
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-ink">Expenses CSV Spreadsheet</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                Spreadsheet-ready CSV table of all logged expense transactions, amounts, and dates
                for Excel or Google Sheets.
              </p>
            </div>
            <Button
              className="mt-5 w-full gap-2 rounded-[18px] h-12"
              disabled={isExportingCsv}
              onClick={handleExportCsv}
              variant="outline"
            >
              {isExportingCsv ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Generating CSV...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Expenses CSV</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {exportNotice && (
          <div className="mt-5 flex items-center gap-2 rounded-[20px] border border-brand/20 bg-brand/10 p-4 text-xs font-semibold text-brand-strong sm:text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}
      </SurfaceCard>

      {/* Transaction Reset & Clean Slate */}
      <SurfaceCard className="rounded-[32px] p-6 sm:p-8 md:p-9 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-amber-500/10 text-amber-600 sm:h-16 sm:w-16 sm:rounded-[24px]">
              <Eraser className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="kicker">Financial Reset</p>
                <Badge variant="warning" className="text-[10px] py-0 px-2">
                  Caution
                </Badge>
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Clear Transaction History
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft sm:text-sm sm:leading-6">
                Wipe all logged expense transactions while preserving your account login, budgets,
                and savings goals.
              </p>
            </div>
          </div>

          <Dialog.Root open={isClearModalOpen} onOpenChange={setIsClearModalOpen}>
            <Dialog.Trigger asChild>
              <Button
                variant="outline"
                className="shrink-0 gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
              >
                <Eraser className="h-4 w-4" />
                <span>Clear Transactions</span>
              </Button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-line bg-surface p-6 shadow-xl sm:p-7">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                      <AlertTriangle className="h-4.5 w-4.5" />
                    </div>
                    <Dialog.Title className="text-base font-bold text-ink sm:text-lg">
                      Clear All Transactions?
                    </Dialog.Title>
                  </div>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="text-ink-soft hover:text-ink focus:outline-none"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleClearTransactions} className="mt-5 space-y-4">
                  <p className="text-xs leading-relaxed text-ink-soft">
                    This will permanently delete all your expense transaction records. Your budgets
                    and goals will remain intact.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink">Enter your password</label>
                    <Input
                      type="password"
                      placeholder="Current account password"
                      value={clearPassword}
                      onChange={(e) => setClearPassword(e.target.value)}
                      className="h-11 rounded-[16px] text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink">Type CLEAR to confirm</label>
                    <Input
                      type="text"
                      placeholder="CLEAR"
                      value={clearConfirmText}
                      onChange={(e) => setClearConfirmText(e.target.value)}
                      className="h-11 rounded-[16px] text-sm font-mono"
                    />
                  </div>

                  {clearError && (
                    <div className="rounded-[14px] border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger">
                      {clearError}
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <Dialog.Close asChild>
                      <Button variant="outline" size="sm" disabled={isClearing}>
                        Cancel
                      </Button>
                    </Dialog.Close>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={clearConfirmText !== 'CLEAR' || !clearPassword || isClearing}
                      className="bg-amber-600 text-white hover:bg-amber-700"
                    >
                      {isClearing ? 'Clearing...' : 'Confirm Clear Data'}
                    </Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        {clearSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-[18px] border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{clearSuccess}</span>
          </div>
        )}
      </SurfaceCard>

      {/* Danger Zone: Permanent Account Deletion */}
      <SurfaceCard className="rounded-[32px] border-danger/30 bg-danger/5 p-6 sm:p-8 md:p-9 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-danger/10 text-danger sm:h-16 sm:w-16 sm:rounded-[24px]">
              <Trash2 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="kicker text-danger">Danger Zone</p>
                <Badge variant="danger" className="text-[10px] py-0.5 px-2.5">
                  Irreversible
                </Badge>
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-danger sm:text-2xl">
                Delete Account Permanently
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft sm:text-sm sm:leading-6">
                Permanently erase your SpendWise account and all associated expenses, budgets,
                goals, and customized settings from our database.
              </p>
            </div>
          </div>

          <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <Dialog.Trigger asChild>
              <Button className="shrink-0 gap-2 bg-danger text-white hover:bg-danger/90">
                <Trash2 className="h-4 w-4" />
                <span>Delete Account</span>
              </Button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-line bg-surface p-6 shadow-2xl sm:p-7">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger/10 text-danger">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <Dialog.Title className="text-base font-bold text-danger sm:text-lg">
                      Permanent Deletion
                    </Dialog.Title>
                  </div>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="text-ink-soft hover:text-ink focus:outline-none"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleDeleteAccount} className="mt-5 space-y-4">
                  <p className="text-xs leading-relaxed text-ink-soft">
                    This action is{' '}
                    <span className="font-bold text-danger">permanent and cannot be undone</span>.
                    All your data will be completely deleted from our servers.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink">Enter your password</label>
                    <Input
                      type="password"
                      placeholder="Account password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="h-11 rounded-[16px] text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink">Type DELETE to confirm</label>
                    <Input
                      type="text"
                      placeholder="DELETE"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="h-11 rounded-[16px] text-sm font-mono"
                    />
                  </div>

                  {deleteError && (
                    <div className="rounded-[14px] border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger">
                      {deleteError}
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <Dialog.Close asChild>
                      <Button variant="outline" size="sm" disabled={isDeleting}>
                        Cancel
                      </Button>
                    </Dialog.Close>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={deleteConfirmText !== 'DELETE' || !deletePassword || isDeleting}
                      className="bg-danger text-white hover:bg-danger/90"
                    >
                      {isDeleting ? 'Deleting Account...' : 'Permanently Delete'}
                    </Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </SurfaceCard>
    </div>
  );
}
