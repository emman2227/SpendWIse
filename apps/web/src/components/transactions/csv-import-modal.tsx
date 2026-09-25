'use client';

import type { Category, ParsedCsvRow } from '@spendwise/shared';
import { FileSpreadsheet, Loader2, Sparkles, UploadCloud, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { importCsv } from '@/lib/transactions/client';

interface CsvImportModalProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  categories,
  onClose,
  onSuccess,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewRows, setPreviewRows] = useState<ParsedCsvRow[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setFileName('');
      setPreviewRows([]);
      setSelectedIndices(new Set());
      setErrorMessage(null);
      setIsPreviewing(false);
      setIsImporting(false);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleFile = (file: File) => {
    if (
      !file.name.endsWith('.csv') &&
      file.type !== 'text/csv' &&
      file.type !== 'application/vnd.ms-excel'
    ) {
      setErrorMessage('Please select a valid .csv file.');
      return;
    }

    setErrorMessage(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      const text = reader.result as string;
      triggerPreview(text);
    };
    reader.onerror = () => setErrorMessage('Failed to read file.');
    reader.readAsText(file);
  };

  const triggerPreview = async (content: string) => {
    setIsPreviewing(true);
    setErrorMessage(null);

    try {
      const res = await importCsv(content, false);
      const rows = res.preview || [];
      setPreviewRows(rows);
      setSelectedIndices(new Set(rows.map((_, idx) => idx)));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to parse CSV. Please check formatting.';
      setErrorMessage(msg);
    } finally {
      setIsPreviewing(false);
    }
  };

  const toggleSelectRow = (idx: number) => {
    const updated = new Set(selectedIndices);
    if (updated.has(idx)) {
      updated.delete(idx);
    } else {
      updated.add(idx);
    }
    setSelectedIndices(updated);
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === previewRows.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(previewRows.map((_, idx) => idx)));
    }
  };

  const handleCommitImport = async () => {
    if (previewRows.length === 0 || selectedIndices.size === 0) return;

    setIsImporting(true);
    setErrorMessage(null);

    try {
      // Re-serialize only selected rows as CSV or commit directly
      const rowsToImport = previewRows.filter((_, idx) => selectedIndices.has(idx));
      const header = 'Date,Description,Amount,Category,PaymentMethod\n';
      const body = rowsToImport
        .map(
          (r) =>
            `${r.date},"${r.description.replace(/"/g, '""')}",${r.amount},${r.categoryId || ''},${r.paymentMethod || 'debit_card'}`,
        )
        .join('\n');

      await importCsv(header + body, true);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete import.';
      setErrorMessage(msg);
    } finally {
      setIsImporting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl rounded-[28px] border border-line bg-paper p-6 shadow-lift max-h-[90vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-line flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
                Import Bank CSV
                {fileName ? (
                  <span className="text-xs font-normal text-ink-muted truncate max-w-[200px]">
                    ({fileName})
                  </span>
                ) : null}
              </h2>
              <p className="text-xs text-ink-muted">
                Universal statement mapper normalizes columns and categorizes automatically.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-ink-muted hover:bg-paper-strong hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {previewRows.length === 0 && !isPreviewing && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand bg-brand/5'
                  : 'border-line hover:border-brand/50 hover:bg-paper-strong'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-paper-strong border border-line flex items-center justify-center text-ink-muted">
                <UploadCloud className="w-7 h-7 text-brand" />
              </div>
              <p className="text-sm font-medium text-ink">
                Drag and drop your bank CSV here, or <span className="text-brand">browse</span>
              </p>
              <p className="text-xs text-ink-muted mt-1">
                Works with exports from Chase, Wells Fargo, BoA, Revolut, Monzo, etc.
              </p>
            </div>
          )}

          {isPreviewing && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand" />
              <p className="text-sm font-medium text-ink">
                Normalizing bank CSV headers with AI...
              </p>
              <p className="text-xs text-ink-muted">Mapping transactions and categories</p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
              {errorMessage}
            </div>
          )}

          {previewRows.length > 0 && !isPreviewing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectedIndices.size === previewRows.length && previewRows.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-line text-brand focus:ring-brand"
                  />
                  <label
                    htmlFor="select-all"
                    className="text-xs font-semibold text-ink cursor-pointer"
                  >
                    Select All ({selectedIndices.size} of {previewRows.length} selected)
                  </label>
                </div>
                <Badge variant="info" className="text-xs">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Auto-Mapped
                </Badge>
              </div>

              <div className="border border-line rounded-2xl overflow-hidden bg-paper-strong max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-paper border-b border-line text-ink-muted uppercase sticky top-0">
                    <tr>
                      <th className="p-3 w-8"></th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {previewRows.map((row, idx) => {
                      const category = categories.find((c) => c.id === row.categoryId);
                      const isSelected = selectedIndices.has(idx);

                      return (
                        <tr
                          key={idx}
                          onClick={() => toggleSelectRow(idx)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-brand/5' : 'hover:bg-paper'
                          }`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(idx)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-line text-brand focus:ring-brand"
                            />
                          </td>
                          <td className="p-3 text-ink-muted whitespace-nowrap">
                            {new Date(row.date).toLocaleDateString()}
                          </td>
                          <td className="p-3 font-medium text-ink max-w-[200px] truncate">
                            {row.description}
                          </td>
                          <td className="p-3 font-semibold text-ink whitespace-nowrap">
                            ${Number(row.amount).toFixed(2)}
                          </td>
                          <td className="p-3 text-ink-muted">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] bg-paper border border-line">
                              {category?.name || 'General'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line pt-4 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setPreviewRows([]);
            }}
            disabled={previewRows.length === 0}
          >
            Clear File
          </Button>

          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isImporting}>
              Cancel
            </Button>
            {previewRows.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleCommitImport}
                disabled={isImporting || selectedIndices.size === 0}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${selectedIndices.size} Transactions`
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
