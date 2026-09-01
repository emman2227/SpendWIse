'use client';

import {
  type Category,
  createExpenseSchema,
  type Expense,
  formatShortDate,
  PAYMENT_METHODS,
  type PaymentMethod,
} from '@spendwise/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CircleAlert,
  CircleX,
  CreditCard,
  Download,
  Filter,
  PencilLine,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { useConfirm } from '@/components/providers/confirm-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Textarea } from '@/components/ui/textarea';
import { dashboardAnalyticsQueryKey } from '@/lib/analytics/client';
import { useCurrentUserQuery } from '@/lib/auth/client';
import { formatMoney as baseFormatMoney } from '@/lib/formatters';
import {
  createExpense,
  deleteExpense,
  listExpenses,
  listTransactionCategories,
  transactionCategoriesQueryKey,
  transactionExpensesQueryKey,
  updateExpense,
} from '@/lib/transactions/client';
import { cn } from '@/lib/utils';

type PaymentMethodFilter = PaymentMethod | 'all';
type StatusFilter = 'all' | 'alert' | 'recurring' | 'normal';
type AmountFilter = 'all' | 'under_25' | '25_to_100' | '100_to_500' | 'over_500';
type SortBy = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'description_asc';
type PageSize = 10 | 25 | 50 | 'all';
type EditorMode = 'create' | 'edit';

interface TransactionFormValues {
  amount: string;
  categoryId: string;
  description: string;
  paymentMethod: PaymentMethod;
  date: string;
  notes: string;
}

type TransactionField = keyof TransactionFormValues;
type TransactionFieldErrors = Partial<Record<TransactionField, string>>;

interface TransactionView extends Expense {
  categoryName: string;
  categoryColor: string;
  recurring: boolean;
  alert: boolean;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  credit_card: 'Credit card',
  debit_card: 'Debit card',
  bank_transfer: 'Bank transfer',
  e_wallet: 'E-wallet',
};

const quickCapturePresets = [
  {
    label: 'Groceries',
    description: 'Groceries',
    categoryMatches: ['Food & Dining'],
    paymentMethod: 'debit_card' as const,
    notes: 'Weekly essentials',
  },
  {
    label: 'Subscription',
    description: 'Subscription renewal',
    categoryMatches: ['Entertainment', 'Utilities', 'Other'],
    paymentMethod: 'credit_card' as const,
    notes: 'Recurring monthly charge',
  },
  {
    label: 'Commute',
    description: 'Commute',
    categoryMatches: ['Transportation'],
    paymentMethod: 'e_wallet' as const,
    notes: 'Daily travel',
  },
  {
    label: 'Dining out',
    description: 'Dining out',
    categoryMatches: ['Food & Dining'],
    paymentMethod: 'credit_card' as const,
    notes: 'Meal expense',
  },
];

const recurringHintPattern =
  /(subscription|membership|rent|renewal|bill|utility|mortgage|gym|monthly)/i;

const selectClassName =
  'flex h-12 w-full rounded-[20px] border border-line bg-paper px-3.5 pr-8 text-sm text-ink shadow-sm outline-none transition focus:border-brand focus:bg-paper-strong';

const compactSelectClassName =
  'flex h-9 rounded-[16px] border border-line bg-paper px-2.5 pr-7 text-xs font-medium text-ink shadow-sm outline-none transition hover:border-brand/40 focus:border-brand focus:bg-paper-strong';

const getInitialMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getDefaultFormValues = (defaultCategoryId?: string): TransactionFormValues => ({
  amount: '',
  categoryId: defaultCategoryId ?? '',
  description: '',
  paymentMethod: 'credit_card',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
});

const toDateInputValue = (value: string) => new Date(value).toISOString().slice(0, 10);

const getMaxExpenseDate = () => new Date().toISOString().slice(0, 10);

const getMinExpenseDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 2);
  return date.toISOString().slice(0, 10);
};

const parseMonthValue = (value: string) => {
  const [yearValue, monthValue] = value.split('-');
  const year = Number(yearValue ?? '');
  const month = Number(monthValue ?? '');

  return {
    month: Number.isFinite(month) && month > 0 ? month : 1,
    year: Number.isFinite(year) && year > 0 ? year : new Date().getFullYear(),
  };
};

const formatMonthLabel = (value: string) => {
  const { month, year } = parseMonthValue(value);

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
};

const resolveTransactionError = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const parseAmountInput = (value: string) => Number(value.replace(/[^\d.]/g, ''));

const toIsoDateValue = (value: string) => {
  if (!value) {
    return '';
  }

  const date = new Date(`${value}T12:00:00`);

  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const getDayLabel = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) {
    return 'Today';
  }

  if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const sanitizeCsvCell = (value: string) => {
  const clean = value.replace(/"/g, '""');
  // Prevent CSV Formula Injection (=, +, -, @, tab, CR)
  if (/^[=+\-@\t\r]/.test(clean)) {
    return `"'${clean}"`;
  }
  return `"${clean}"`;
};

const buildCsv = (transactions: TransactionView[]) => {
  const rows = [
    ['Date', 'Description', 'Category', 'Amount', 'Payment Method', 'Notes'],
    ...transactions.map((transaction) => [
      toDateInputValue(transaction.date),
      transaction.description,
      transaction.categoryName,
      transaction.amount.toFixed(2),
      paymentMethodLabels[transaction.paymentMethod],
      transaction.notes ?? '',
    ]),
  ];

  return rows.map((row) => row.map((cell) => sanitizeCsvCell(cell)).join(',')).join('\n');
};

const getCategoryByName = (categories: Category[], names: string[]) =>
  categories.find((category) => names.includes(category.name));

const categoryTone = (color?: string) =>
  color
    ? { backgroundColor: `${color}1A`, color }
    : { backgroundColor: '#F1F5F9', color: '#334155' };

function TransactionEditorModal({
  categories,
  formValues,
  fieldErrors,
  formError,
  isSubmitting,
  mode,
  onClose,
  onFieldChange,
  onPresetSelect,
  onSubmit,
}: {
  categories: Category[];
  formValues: TransactionFormValues;
  fieldErrors: TransactionFieldErrors;
  formError: string;
  isSubmitting: boolean;
  mode: EditorMode;
  onClose: () => void;
  onFieldChange: (field: TransactionField, value: string) => void;
  onPresetSelect: (label: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(19,38,63,0.42)] px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="panel-surface-strong max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] px-5 py-5 md:px-7 md:py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="kicker">{mode === 'create' ? 'Add' : 'Edit'}</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">
              {mode === 'create' ? 'Quick add' : 'Update expense'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              {mode === 'create'
                ? 'Save a new transaction with the essentials up front.'
                : 'Adjust the amount, category, date, or notes and save the change.'}
            </p>
          </div>
          <button
            aria-label="Close transaction editor"
            className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-line bg-paper-strong text-ink-soft transition hover:border-brand/30 hover:text-ink"
            onClick={onClose}
            type="button"
          >
            <CircleX className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {quickCapturePresets.map((preset) => (
            <button
              key={preset.label}
              className="rounded-full border border-line bg-paper-strong px-3.5 py-2 text-sm font-semibold text-ink-soft transition hover:border-brand/30 hover:text-ink"
              onClick={() => onPresetSelect(preset.label)}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Amount</span>
              <Input
                className={cn(fieldErrors.amount && 'border-danger focus:border-danger')}
                inputMode="decimal"
                onChange={(event) => onFieldChange('amount', event.target.value)}
                placeholder="0.00"
                value={formValues.amount}
              />
              {fieldErrors.amount ? (
                <p className="text-sm text-danger">{fieldErrors.amount}</p>
              ) : null}
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Category</span>
              <select
                className={cn(selectClassName, fieldErrors.categoryId && 'border-danger')}
                onChange={(event) => onFieldChange('categoryId', event.target.value)}
                value={formValues.categoryId}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId ? (
                <p className="text-sm text-danger">{fieldErrors.categoryId}</p>
              ) : null}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-ink">
              <div className="flex items-center justify-between">
                <span>Date</span>
                <span className="text-xs font-normal text-ink-soft">Today or past 2 yrs</span>
              </div>
              <Input
                className={cn(fieldErrors.date && 'border-danger focus:border-danger')}
                max={getMaxExpenseDate()}
                min={getMinExpenseDate()}
                onChange={(event) => onFieldChange('date', event.target.value)}
                type="date"
                value={formValues.date}
              />
              {fieldErrors.date ? <p className="text-sm text-danger">{fieldErrors.date}</p> : null}
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Payment method</span>
              <select
                className={cn(selectClassName, fieldErrors.paymentMethod && 'border-danger')}
                onChange={(event) => onFieldChange('paymentMethod', event.target.value)}
                value={formValues.paymentMethod}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {paymentMethodLabels[method]}
                  </option>
                ))}
              </select>
              {fieldErrors.paymentMethod ? (
                <p className="text-sm text-danger">{fieldErrors.paymentMethod}</p>
              ) : null}
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium text-ink">
            <div className="flex items-center justify-between">
              <span>Merchant or description</span>
              <span
                className={cn(
                  'text-xs font-normal',
                  formValues.description.length >= 120
                    ? 'font-semibold text-danger'
                    : 'text-ink-soft',
                )}
              >
                {formValues.description.length}/120
              </span>
            </div>
            <Input
              className={cn(fieldErrors.description && 'border-danger focus:border-danger')}
              maxLength={120}
              onChange={(event) => onFieldChange('description', event.target.value)}
              placeholder="Where did you spend?"
              value={formValues.description}
            />
            {fieldErrors.description ? (
              <p className="text-sm text-danger">{fieldErrors.description}</p>
            ) : null}
          </label>

          <label className="space-y-2 text-sm font-medium text-ink">
            <div className="flex items-center justify-between">
              <span>Notes</span>
              <span
                className={cn(
                  'text-xs font-normal',
                  formValues.notes.length >= 200 ? 'font-semibold text-danger' : 'text-ink-soft',
                )}
              >
                {formValues.notes.length}/200
              </span>
            </div>
            <Textarea
              className={cn(
                'min-h-[100px] resize-none',
                fieldErrors.notes && 'border-danger focus:border-danger',
              )}
              maxLength={200}
              onChange={(event) => onFieldChange('notes', event.target.value)}
              placeholder="Optional notes or context (max 200 chars)"
              value={formValues.notes}
            />
            {fieldErrors.notes ? <p className="text-sm text-danger">{fieldErrors.notes}</p> : null}
          </label>

          {formError ? (
            <div className="rounded-[20px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {formError}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button disabled={isSubmitting} type="submit" variant="secondary">
              {isSubmitting
                ? mode === 'create'
                  ? 'Saving...'
                  : 'Updating...'
                : mode === 'create'
                  ? 'Save expense'
                  : 'Save changes'}
            </Button>
            <Button disabled={isSubmitting} onClick={onClose} type="button" variant="soft">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUserQuery();
  const { confirmDelete, confirmSave } = useConfirm();
  const formatMoney = (amount: number) => baseFormatMoney(amount, user?.currency ?? 'PHP');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState(getInitialMonthValue);
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethodFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [amountFilter, setAmountFilter] = useState<AmountFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date_desc');
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [formValues, setFormValues] = useState<TransactionFormValues>(getDefaultFormValues());
  const [fieldErrors, setFieldErrors] = useState<TransactionFieldErrors>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [listFeedback, setListFeedback] = useState('');

  const activeMonth = parseMonthValue(monthFilter);
  const categoriesQuery = useQuery({
    queryKey: transactionCategoriesQueryKey,
    queryFn: listTransactionCategories,
  });
  const expensesQuery = useQuery({
    queryKey: transactionExpensesQueryKey(activeMonth),
    queryFn: () => listExpenses(activeMonth),
  });

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const expenses = useMemo(() => expensesQuery.data ?? [], [expensesQuery.data]);
  const averageAmount = useMemo(
    () =>
      expenses.length > 0
        ? expenses.reduce((total, transaction) => total + transaction.amount, 0) / expenses.length
        : 0,
    [expenses],
  );

  const transactionViews: TransactionView[] = useMemo(() => {
    return expenses.map((expense) => {
      const category = categories.find((item) => item.id === expense.categoryId);
      const recurring = recurringHintPattern.test(`${expense.description} ${expense.notes ?? ''}`);
      const alert = expense.amount >= Math.max(averageAmount * 2.2, 250);

      return {
        ...expense,
        categoryName: category?.name ?? 'Uncategorized',
        categoryColor: category?.color ?? '#94A3B8',
        recurring,
        alert,
      };
    });
  }, [expenses, categories, averageAmount]);

  const visibleTransactions = useMemo(() => {
    return transactionViews.filter((transaction) => {
      const matchesSearch =
        !searchValue ||
        `${transaction.description} ${transaction.notes ?? ''} ${transaction.categoryName} ${paymentMethodLabels[transaction.paymentMethod]}`
          .toLowerCase()
          .includes(searchValue.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || transaction.categoryId === categoryFilter;
      const matchesPayment =
        paymentMethodFilter === 'all' || transaction.paymentMethod === paymentMethodFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'alert' && transaction.alert) ||
        (statusFilter === 'recurring' && transaction.recurring) ||
        (statusFilter === 'normal' && !transaction.alert && !transaction.recurring);

      const matchesAmount =
        amountFilter === 'all' ||
        (amountFilter === 'under_25' && transaction.amount < 25) ||
        (amountFilter === '25_to_100' && transaction.amount >= 25 && transaction.amount <= 100) ||
        (amountFilter === '100_to_500' && transaction.amount > 100 && transaction.amount <= 500) ||
        (amountFilter === 'over_500' && transaction.amount > 500);

      return matchesSearch && matchesCategory && matchesPayment && matchesStatus && matchesAmount;
    });
  }, [
    transactionViews,
    searchValue,
    categoryFilter,
    paymentMethodFilter,
    statusFilter,
    amountFilter,
  ]);

  const sortedTransactions = useMemo(() => {
    const list = [...visibleTransactions];
    switch (sortBy) {
      case 'date_asc':
        return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'amount_desc':
        return list.sort((a, b) => b.amount - a.amount);
      case 'amount_asc':
        return list.sort((a, b) => a.amount - b.amount);
      case 'description_asc':
        return list.sort((a, b) => a.description.localeCompare(b.description));
      case 'date_desc':
      default:
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }, [visibleTransactions, sortBy]);

  const isFiltered = Boolean(
    searchValue ||
    categoryFilter !== 'all' ||
    paymentMethodFilter !== 'all' ||
    statusFilter !== 'all' ||
    amountFilter !== 'all' ||
    sortBy !== 'date_desc',
  );

  const handleResetFilters = () => {
    setSearchValue('');
    setCategoryFilter('all');
    setPaymentMethodFilter('all');
    setStatusFilter('all');
    setAmountFilter('all');
    setSortBy('date_desc');
    setCurrentPage(1);
  };

  // Reset page when any filter criteria or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchValue,
    categoryFilter,
    paymentMethodFilter,
    statusFilter,
    amountFilter,
    monthFilter,
    sortBy,
    pageSize,
  ]);

  const totalItems = sortedTransactions.length;
  const effectivePageSize = pageSize === 'all' ? totalItems || 1 : pageSize;
  const totalPages =
    pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

  const paginatedTransactions = useMemo(() => {
    if (pageSize === 'all') {
      return sortedTransactions;
    }
    const startIndex = (currentPage - 1) * effectivePageSize;
    return sortedTransactions.slice(startIndex, startIndex + effectivePageSize);
  }, [sortedTransactions, currentPage, effectivePageSize, pageSize]);

  const groupedTransactions = useMemo(() => {
    return paginatedTransactions.reduce<
      Array<{ label: string; key: string; items: TransactionView[] }>
    >((groups, transaction) => {
      const key = toDateInputValue(transaction.date);
      const currentGroup = groups.find((group) => group.key === key);

      if (currentGroup) {
        currentGroup.items.push(transaction);
        return groups;
      }

      groups.push({
        key,
        label: getDayLabel(transaction.date),
        items: [transaction],
      });

      return groups;
    }, []);
  }, [paginatedTransactions]);

  const totalVisible = visibleTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );
  const recurringCount = visibleTransactions.filter((transaction) => transaction.recurring).length;
  const flaggedCount = visibleTransactions.filter((transaction) => transaction.alert).length;
  const averageTransaction =
    visibleTransactions.length > 0 ? totalVisible / visibleTransactions.length : 0;
  const activeCategoryCount = new Set(
    visibleTransactions.map((transaction) => transaction.categoryId),
  ).size;

  useEffect(() => {
    const currentCategories = categoriesQuery.data ?? [];
    if (
      !isEditorOpen ||
      editorMode !== 'create' ||
      formValues.categoryId ||
      currentCategories.length === 0
    ) {
      return;
    }

    setFormValues((currentValues) => ({
      ...currentValues,
      categoryId: currentValues.categoryId || currentCategories[0]?.id || '',
    }));
  }, [categoriesQuery.data, editorMode, formValues.categoryId, isEditorOpen]);

  const resetEditorState = (defaultCategoryId?: string) => {
    setFieldErrors({});
    setFormError('');
    setFormValues(getDefaultFormValues(defaultCategoryId));
    setEditingExpenseId(null);
  };

  const openCreateEditor = () => {
    setEditorMode('create');
    resetEditorState(categories[0]?.id);
    setIsEditorOpen(true);
  };

  const openEditEditor = (expense: TransactionView) => {
    setEditorMode('edit');
    setEditingExpenseId(expense.id);
    setFieldErrors({});
    setFormError('');
    setFormValues({
      amount: expense.amount.toFixed(2),
      categoryId: expense.categoryId,
      description: expense.description,
      paymentMethod: expense.paymentMethod,
      date: toDateInputValue(expense.date),
      notes: expense.notes ?? '',
    });
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    resetEditorState(categories[0]?.id);
  };

  const handleFieldChange = (field: TransactionField, value: string) => {
    let sanitizedValue = value;

    if (field === 'amount') {
      // Only allow digits and up to 2 decimal places
      const match = value.replace(/[^\d.]/g, '').match(/^(\d*)(\.?\d{0,2})/);
      sanitizedValue = match ? `${match[1]}${match[2]}` : '';
    }

    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: field === 'paymentMethod' ? (sanitizedValue as PaymentMethod) : sanitizedValue,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: '',
    }));
    setFormError('');
  };

  const handlePresetSelect = (label: string) => {
    const preset = quickCapturePresets.find((item) => item.label === label);

    if (!preset) {
      return;
    }

    const matchingCategory = getCategoryByName(categories, preset.categoryMatches);

    setFormValues((currentValues) => ({
      ...currentValues,
      categoryId: matchingCategory?.id ?? currentValues.categoryId,
      description: preset.description,
      paymentMethod: preset.paymentMethod,
      notes: preset.notes,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      categoryId: '',
      description: '',
      paymentMethod: '',
      notes: '',
    }));
    setFormError('');
  };

  const buildValidatedPayload = () => {
    const candidate = {
      amount: parseAmountInput(formValues.amount),
      categoryId: formValues.categoryId,
      description: formValues.description.trim(),
      paymentMethod: formValues.paymentMethod,
      date: toIsoDateValue(formValues.date),
      notes: formValues.notes.trim() || undefined,
    };

    const result = createExpenseSchema.safeParse(candidate);

    if (!result.success) {
      const nextErrors: TransactionFieldErrors = {};

      Object.entries(result.error.flatten().fieldErrors).forEach(([field, messages]) => {
        const firstMessage = messages?.[0];

        if (firstMessage) {
          nextErrors[field as TransactionField] = firstMessage;
        }
      });

      setFieldErrors(nextErrors);
      setFormError('Please correct the highlighted fields before saving.');

      return null;
    }

    setFieldErrors({});
    return result.data;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = buildValidatedPayload();

    if (!payload) {
      return;
    }

    if (editorMode === 'edit') {
      const confirmed = await confirmSave({
        title: 'Save transaction changes?',
        description: `Are you sure you want to save the updated details for "${payload.description}" (${formatMoney(payload.amount)})?`,
        confirmText: 'Save changes',
      });

      if (!confirmed) {
        return;
      }
    }

    setIsSubmitting(true);
    setFormError('');
    setListFeedback('');

    try {
      if (editorMode === 'create') {
        await createExpense(payload);
        setListFeedback('Transaction saved.');
      } else if (editingExpenseId) {
        await updateExpense(editingExpenseId, payload);
        setListFeedback('Transaction updated.');
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions', 'expenses'] }),
        queryClient.invalidateQueries({ queryKey: dashboardAnalyticsQueryKey }),
      ]);
      closeEditor();
    } catch (error) {
      setFormError(resolveTransactionError(error, 'Unable to save the transaction right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (expenseId: string) => {
    const targetExpense = visibleTransactions.find((t) => t.id === expenseId);
    const confirmed = await confirmDelete({
      title: 'Delete transaction?',
      description: targetExpense
        ? `Are you sure you want to delete "${targetExpense.description}" (${formatMoney(targetExpense.amount)})? This action cannot be undone.`
        : 'Are you sure you want to delete this transaction? This action cannot be undone.',
      confirmText: 'Delete transaction',
    });

    if (!confirmed) {
      return;
    }

    setDeleteTargetId(expenseId);
    setListFeedback('');

    try {
      await deleteExpense(expenseId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions', 'expenses'] }),
        queryClient.invalidateQueries({ queryKey: dashboardAnalyticsQueryKey }),
      ]);
      setListFeedback('Transaction deleted.');
    } catch (error) {
      setListFeedback(
        resolveTransactionError(error, 'Unable to delete the transaction right now.'),
      );
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleExport = () => {
    if (visibleTransactions.length === 0) {
      return;
    }

    const blob = new Blob([buildCsv(visibleTransactions)], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `transactions-${monthFilter}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    try {
      const response = await fetch(`/api/expenses/export`);
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `all-transactions.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setFormError('Failed to export all transactions.');
    }
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          actions={
            <>
              <Button
                disabled={visibleTransactions.length === 0 || expensesQuery.isLoading}
                onClick={handleExport}
                variant="soft"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button disabled={expensesQuery.isLoading} onClick={handleExportAll} variant="soft">
                <Download className="h-4 w-4" />
                Export All
              </Button>
              <Button
                disabled={categoriesQuery.isLoading || categories.length === 0}
                onClick={openCreateEditor}
                variant="secondary"
              >
                Add expense
              </Button>
            </>
          }
          description="Search, review, filter, sort, and paginate live transactions with ease."
          eyebrow="Transactions"
          meta={
            <>
              <Badge variant="info">{formatMonthLabel(monthFilter)}</Badge>
              <Badge variant="neutral">
                {expensesQuery.isLoading ? 'Syncing' : `${totalItems} total`}
              </Badge>
            </>
          }
          title="Track spending fast."
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            delta={`${visibleTransactions.length} entries`}
            helper="Current filtered view"
            icon={ReceiptText}
            label="Visible spend"
            value={formatMoney(totalVisible)}
          />
          <MetricCard
            delta={recurringCount ? `${recurringCount} likely recurring` : 'No recurring hints'}
            helper={`${activeCategoryCount} categories in view`}
            icon={CreditCard}
            label="Recurring detected"
            tone="mint"
            value={recurringCount.toString()}
          />
          <MetricCard
            delta={flaggedCount ? 'Worth a closer look' : 'No review flags'}
            helper={`Average expense ${formatMoney(averageTransaction)}`}
            icon={CircleAlert}
            label="Review queue"
            value={flaggedCount.toString()}
          />
        </section>

        {/* Streamlined Filter & Controls Card */}
        <SurfaceCard className="rounded-[30px] p-5 md:p-6">
          <div className="space-y-4">
            {/* Top row: Search, Month, Payment Method, Status, and Amount filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input (compact & well-proportioned) */}
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  className="pl-10 pr-9"
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search payee, note..."
                  value={searchValue}
                />
                {searchValue ? (
                  <button
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft transition hover:text-ink"
                    onClick={() => setSearchValue('')}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {/* Month selector (ample room for month name + calendar picker button) */}
              <div className="w-full sm:w-[195px]">
                <Input
                  aria-label="Filter by month"
                  className="w-full pr-2"
                  onChange={(event) => setMonthFilter(event.target.value)}
                  type="month"
                  value={monthFilter}
                />
              </div>

              {/* Payment method selector */}
              <div className="w-full sm:w-[170px] flex-1 min-w-[150px]">
                <select
                  aria-label="Filter by payment method"
                  className={selectClassName}
                  onChange={(event) =>
                    setPaymentMethodFilter(event.target.value as PaymentMethodFilter)
                  }
                  value={paymentMethodFilter}
                >
                  <option value="all">All methods</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {paymentMethodLabels[method]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status / Review Filter */}
              <div className="w-full sm:w-[160px] flex-1 min-w-[140px]">
                <select
                  aria-label="Filter by status"
                  className={selectClassName}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  value={statusFilter}
                >
                  <option value="all">All statuses</option>
                  <option value="alert">Needs review</option>
                  <option value="recurring">Recurring hints</option>
                  <option value="normal">Standard</option>
                </select>
              </div>

              {/* Amount Range Filter */}
              <div className="w-full sm:w-[160px] flex-1 min-w-[140px]">
                <select
                  aria-label="Filter by amount range"
                  className={selectClassName}
                  onChange={(event) => setAmountFilter(event.target.value as AmountFilter)}
                  value={amountFilter}
                >
                  <option value="all">All amounts</option>
                  <option value="under_25">Under $25</option>
                  <option value="25_to_100">$25 - $100</option>
                  <option value="100_to_500">$100 - $500</option>
                  <option value="over_500">Over $500</option>
                </select>
              </div>
            </div>

            {/* Bottom row: Category Pills and Reset Filter Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  <Filter className="h-3.5 w-3.5 text-brand" />
                  Category:
                </span>
                <button
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                    categoryFilter === 'all'
                      ? 'bg-brand text-white shadow-sm'
                      : 'border border-line bg-paper-strong text-ink-soft hover:border-brand/30 hover:text-ink',
                  )}
                  onClick={() => setCategoryFilter('all')}
                  type="button"
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                      categoryFilter === category.id
                        ? 'bg-brand text-white shadow-sm'
                        : 'border border-line bg-paper-strong text-ink-soft hover:border-brand/30 hover:text-ink',
                    )}
                    onClick={() => setCategoryFilter(category.id)}
                    type="button"
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {isFiltered ? (
                <button
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft transition hover:text-brand"
                  onClick={handleResetFilters}
                  type="button"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset filters
                </button>
              ) : null}
            </div>
          </div>
        </SurfaceCard>

        {/* Transaction List Card */}
        <SurfaceCard className="rounded-[28px] p-4 md:p-5">
          {/* Header with perfectly aligned title block and right-anchored toolbar */}
          <div className="flex flex-col gap-3 border-b border-line/70 pb-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="kicker">Transaction list</p>
              <h2 className="mt-0.5 text-xl font-semibold leading-tight text-ink md:text-2xl">
                Latest activity
              </h2>
              <p className="mt-0.5 text-xs text-ink-soft sm:text-sm">
                Review, edit, and manage your recent expenses.
              </p>
            </div>

            {/* Interactive Header Controls Toolbar (Aligned horizontally to the right corner) */}
            <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap sm:justify-end">
              {/* Sort Order Dropdown */}
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Sort:
                </span>
                <select
                  aria-label="Sort order"
                  className={compactSelectClassName}
                  onChange={(event) => setSortBy(event.target.value as SortBy)}
                  value={sortBy}
                >
                  <option value="date_desc">Newest date</option>
                  <option value="date_asc">Oldest date</option>
                  <option value="amount_desc">Amount (High to Low)</option>
                  <option value="amount_asc">Amount (Low to High)</option>
                  <option value="description_asc">Alphabetical (A-Z)</option>
                </select>
              </div>

              {/* Rows Per Page Dropdown */}
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Rows:
                </span>
                <select
                  aria-label="Rows per page"
                  className={compactSelectClassName}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPageSize(value === 'all' ? 'all' : (Number(value) as PageSize));
                  }}
                  value={pageSize}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value="all">All rows</option>
                </select>
              </div>

              {/* Dynamic Status / Count Badge */}
              <Badge
                className="h-9 whitespace-nowrap px-3"
                variant={isFiltered ? 'info' : 'neutral'}
              >
                {isFiltered ? `Filtered (${totalItems})` : `${totalItems} total`}
              </Badge>

              {/* Add Expense Button (Rightmost element) */}
              <Button
                className="whitespace-nowrap"
                disabled={categoriesQuery.isLoading || categories.length === 0}
                onClick={openCreateEditor}
                size="sm"
                variant="secondary"
              >
                <Plus className="h-4 w-4" />
                Add expense
              </Button>
            </div>
          </div>

          {categoriesQuery.isError ? (
            <div className="mt-4 rounded-[20px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {resolveTransactionError(
                categoriesQuery.error,
                'Unable to load categories right now.',
              )}
            </div>
          ) : null}

          {expensesQuery.isError ? (
            <div className="mt-4 rounded-[20px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {resolveTransactionError(
                expensesQuery.error,
                'Unable to load transactions right now.',
              )}
            </div>
          ) : null}

          {listFeedback ? (
            <div
              className={cn(
                'mt-4 rounded-[20px] px-4 py-3 text-sm',
                listFeedback.toLowerCase().includes('unable')
                  ? 'border border-danger/20 bg-danger/10 text-danger'
                  : 'border border-brand/15 bg-brand/10 text-ink',
              )}
            >
              {listFeedback}
            </div>
          ) : null}

          {expensesQuery.isLoading ? (
            <div className="mt-4 space-y-5">
              {Array.from({ length: 3 }).map((_, groupIndex) => (
                <div key={groupIndex}>
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-3 w-24 rounded-full" />
                    <Skeleton className="h-3 w-16 rounded-full" />
                  </div>
                  <div className="mt-2.5 space-y-2">
                    {Array.from({ length: 2 }).map((_, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="rounded-[20px] border border-line bg-paper px-3.5 py-3"
                      >
                        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
                          <div className="flex min-w-0 items-center gap-3.5">
                            <Skeleton className="h-11 w-11 rounded-[16px]" />
                            <div className="min-w-0 flex-1">
                              <Skeleton className="h-4 w-40 rounded-full" />
                              <Skeleton className="mt-2 h-3 w-24 rounded-full" />
                            </div>
                          </div>
                          <div className="flex gap-3 xl:items-center">
                            <Skeleton className="h-8 w-20 rounded-full" />
                            <Skeleton className="h-8 w-24 rounded-full" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : groupedTransactions.length > 0 ? (
            <div className="mt-4 space-y-5">
              {groupedTransactions.map((group) => {
                const groupTotal = group.items.reduce((total, item) => total + item.amount, 0);

                return (
                  <div key={group.key}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-soft">
                        {group.label}
                      </p>
                      <p className="text-sm font-medium text-ink-soft">{formatMoney(groupTotal)}</p>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      {group.items.map((transaction) => (
                        <article
                          key={transaction.id}
                          className="rounded-[22px] border border-line bg-paper px-3.5 py-3 transition hover:border-brand/30"
                        >
                          <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex min-w-0 flex-1 items-start gap-3.5">
                              <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] text-sm font-semibold"
                                style={categoryTone(transaction.categoryColor)}
                              >
                                {transaction.description.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p
                                    className="line-clamp-2 break-words text-[15px] font-semibold text-ink"
                                    title={transaction.description}
                                  >
                                    {transaction.description}
                                  </p>
                                  <Badge variant={transaction.alert ? 'warning' : 'neutral'}>
                                    {transaction.categoryName}
                                  </Badge>
                                  {transaction.recurring ? (
                                    <Badge variant="info">Recurring</Badge>
                                  ) : null}
                                  {transaction.alert ? (
                                    <Badge variant="danger">Needs review</Badge>
                                  ) : null}
                                </div>
                                <p
                                  className="mt-1 line-clamp-2 break-words text-sm text-ink-soft"
                                  title={transaction.notes}
                                >
                                  {transaction.notes?.trim() || 'No notes added.'}
                                </p>
                              </div>
                            </div>

                            <div className="grid shrink-0 gap-2 sm:grid-cols-3 xl:flex xl:items-center xl:gap-2.5">
                              <div className="rounded-[16px] border border-line bg-paper px-3 py-2 xl:min-w-[112px]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                                  Date
                                </p>
                                <p className="mt-1 text-sm font-medium text-ink">
                                  {formatShortDate(transaction.date)}
                                </p>
                              </div>
                              <div className="rounded-[16px] border border-line bg-paper px-3 py-2 xl:min-w-[156px]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                                  Method
                                </p>
                                <p className="mt-1 text-sm font-medium text-ink">
                                  {paymentMethodLabels[transaction.paymentMethod]}
                                </p>
                              </div>
                              <div className="rounded-[16px] border border-line bg-paper px-3 py-2 xl:min-w-[168px]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                                  Updated
                                </p>
                                <p className="mt-1 text-sm font-medium text-ink">
                                  {formatShortDate(transaction.updatedAt)}
                                </p>
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-col gap-2.5 xl:min-w-[204px] xl:items-end">
                              <div className="xl:text-right">
                                <p className="text-lg font-semibold text-ink">
                                  {formatMoney(transaction.amount)}
                                </p>
                                <p className="mt-1 text-sm text-ink-soft">
                                  {transaction.alert
                                    ? 'Review'
                                    : transaction.recurring
                                      ? 'Recurring hint'
                                      : 'Normal'}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  className="rounded-full border border-line bg-paper-strong px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-brand/30 hover:text-ink"
                                  onClick={() => openEditEditor(transaction)}
                                  type="button"
                                >
                                  <span className="inline-flex items-center gap-1.5">
                                    <PencilLine className="h-3.5 w-3.5" />
                                    Edit
                                  </span>
                                </button>
                                <button
                                  className="rounded-full border border-danger/20 bg-paper-strong px-3 py-1.5 text-xs font-semibold text-danger transition hover:border-danger/40 hover:bg-danger/5"
                                  disabled={deleteTargetId === transaction.id}
                                  onClick={() => handleDelete(transaction.id)}
                                  type="button"
                                >
                                  <span className="inline-flex items-center gap-1.5">
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {deleteTargetId === transaction.id ? 'Deleting...' : 'Delete'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Bottom Pagination Controls */}
              {pageSize !== 'all' && totalItems > 0 ? (
                <div className="mt-3.5 border-t border-line/60 pt-3">
                  <Pagination
                    alwaysShow
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    pageSize={effectivePageSize}
                    totalItems={totalItems}
                    totalPages={totalPages}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              action={
                <Button
                  disabled={categoriesQuery.isLoading || categories.length === 0}
                  onClick={openCreateEditor}
                  variant="soft"
                >
                  Add your first expense
                </Button>
              }
              className="mt-5 rounded-[24px] px-5 py-6"
              description={
                isFiltered
                  ? 'Try resetting your filters or searching with broader terms.'
                  : `No transactions found for ${formatMonthLabel(monthFilter)} yet.`
              }
              icon={Search}
              title={isFiltered ? 'No transactions match this view' : 'No transactions yet'}
            />
          )}
        </SurfaceCard>
      </div>

      {isEditorOpen ? (
        <TransactionEditorModal
          categories={categories}
          fieldErrors={fieldErrors}
          formError={formError}
          formValues={formValues}
          isSubmitting={isSubmitting}
          mode={editorMode}
          onClose={closeEditor}
          onFieldChange={handleFieldChange}
          onPresetSelect={handlePresetSelect}
          onSubmit={handleSubmit}
        />
      ) : null}
    </>
  );
}
