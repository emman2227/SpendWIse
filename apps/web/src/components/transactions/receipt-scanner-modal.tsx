'use client';

import type { Category, ParsedReceiptResult } from '@spendwise/shared';
import { CheckCircle2, FileText, Loader2, Sparkles, UploadCloud, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { scanReceipt } from '@/lib/transactions/client';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  categories?: Category[];
  onClose: () => void;
  onApply: (result: ParsedReceiptResult) => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ParsedReceiptResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      setFileBase64(null);
      setExtractedData(null);
      setScanError(null);
      setIsScanning(false);
      setFileName('');
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setScanError('Please upload an image (PNG, JPG, WebP) or PDF receipt.');
      return;
    }

    setScanError(null);
    setFileName(file.name);
    setExtractedData(null);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(file.type.startsWith('image/') ? dataUrl : null);
      // Strip data url prefix for API if needed, or pass full string
      const base64Data = dataUrl.split(',')[1] || dataUrl;
      setFileBase64(base64Data);
      // Trigger scan immediately
      triggerScan(base64Data, file.type);
    };
    reader.onerror = () => setScanError('Failed to read file.');
    reader.readAsDataURL(file);
  };

  const triggerScan = async (base64: string, mime: string) => {
    setIsScanning(true);
    setScanError(null);

    try {
      const result = await scanReceipt(base64, mime);
      setExtractedData(result);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to scan receipt. Please try again or enter manually.';
      setScanError(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (extractedData) {
      onApply(extractedData);
      onClose();
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

      <div className="relative w-full max-w-xl rounded-[28px] border border-line bg-paper p-6 shadow-lift max-h-[90vh] overflow-y-auto z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">Scan Receipt with AI</h2>
              <p className="text-xs text-ink-muted">
                Extract merchant, amount, date, and category automatically.
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

        <div className="mt-5 space-y-4">
          {!fileBase64 && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand bg-brand/5'
                  : 'border-line hover:border-brand/50 hover:bg-paper-strong'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-paper-strong border border-line flex items-center justify-center text-ink-muted group-hover:text-brand">
                <UploadCloud className="w-7 h-7 text-brand" />
              </div>
              <p className="text-sm font-medium text-ink">
                Drag and drop your receipt here, or <span className="text-brand">browse</span>
              </p>
              <p className="text-xs text-ink-muted mt-1">Supports JPG, PNG, WebP, or PDF</p>
            </div>
          )}

          {fileBase64 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-paper-strong border border-line">
                <div className="flex items-center gap-3 min-w-0">
                  {previewUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="w-12 h-12 object-cover rounded-lg border border-line flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0 text-brand">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{fileName}</p>
                    <p className="text-xs text-ink-muted">Receipt file ready</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFileBase64(null);
                    setPreviewUrl(null);
                    setExtractedData(null);
                  }}
                >
                  Change
                </Button>
              </div>

              {isScanning && (
                <div className="py-8 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand" />
                  <p className="text-sm font-medium text-ink">
                    Analyzing receipt with Gemini Vision...
                  </p>
                  <p className="text-xs text-ink-muted">
                    Reading merchant details, line items, and totals
                  </p>
                </div>
              )}

              {scanError && (
                <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
                  {scanError}
                </div>
              )}

              {extractedData && !isScanning && (
                <div className="p-4 rounded-2xl bg-paper-strong border border-line space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                      Extracted Details
                    </span>
                    <Badge variant="success" className="text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      {Math.round((extractedData.confidence || 0.9) * 100)}% Confidence
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-ink-muted block">Merchant</span>
                      <span className="font-semibold text-ink">{extractedData.merchant}</span>
                    </div>
                    <div>
                      <span className="text-xs text-ink-muted block">Total Amount</span>
                      <span className="font-semibold text-ink">
                        ${Number(extractedData.amount).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-ink-muted block">Date</span>
                      <span className="text-ink">
                        {new Date(extractedData.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-ink-muted block">Suggested Category</span>
                      <span className="text-brand font-medium">
                        {extractedData.categoryName || 'General'}
                      </span>
                    </div>
                  </div>

                  {extractedData.lineItems && extractedData.lineItems.length > 0 && (
                    <div className="pt-2 border-t border-line/60">
                      <span className="text-xs text-ink-muted block mb-1">Detected Items:</span>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {extractedData.lineItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-ink-muted">
                            <span className="truncate mr-2">{item.description}</span>
                            <span>${Number(item.amount).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {extractedData && (
            <Button type="button" variant="secondary" onClick={handleApply}>
              Apply to Expense Form
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
