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
  PencilLine,
  ReceiptText,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Textarea } from '@/components/ui/textarea';
import { formatMoney } from '@/lib/formatters';
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
  'flex h-12 w-full rounded-[20px] border border-line bg-white/80 px-4 text-sm text-ink shadow-sm outline-none transition focus:border-brand focus:bg-white';

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

  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
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
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {mode === 'create'
                ? 'Save a new transaction with the essentials up front.'
                : 'Adjust the amount, category, date, or notes and save the change.'}
            </p>
          </div>
          <button
            aria-label="Close transaction editor"
            className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-line bg-white text-slate-500 transition hover:border-brand/30 hover:text-ink"
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
              className="rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
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
              <span>Date</span>
              <Input
                className={cn(fieldErrors.date && 'border-danger focus:border-danger')}
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
            <span>Merchant or description</span>
            <Input
              className={cn(fieldErrors.description && 'border-danger focus:border-danger')}
              onChange={(event) => onFieldChange('description', event.target.value)}
              placeholder="Where did you spend?"
              value={formValues.description}
            />
            {fieldErrors.description ? (
              <p className="text-sm text-danger">{fieldErrors.description}</p>
            ) : null}
          </label>

          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Notes</span>
            <Textarea
              className={cn(
                'min-h-[110px]',
                fieldErrors.notes && 'border-danger focus:border-danger',
              )}
              onChange={(event) => onFieldChange('notes', event.target.value)}
              placeholder="Optional notes or context"
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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState(getInitialMonthValue);
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethodFilter>('all');
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

  const categories = categoriesQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];
  const averageAmount =
    expenses.length > 0
      ? expenses.reduce((total, transaction) => total + transaction.amount, 0) / expenses.length
      : 0;
  const transactionViews: TransactionView[] = expenses.map((expense) => {
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

  const visibleTransactions = transactionViews.filter((transaction) => {
    const matchesSearch =
      !searchValue ||
      `${transaction.description} ${transaction.notes ?? ''} ${transaction.categoryName} ${paymentMethodLabels[transaction.paymentMethod]}`
        .toLowerCase()
        .includes(searchValue.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || transaction.categoryId === categoryFilter;
    const matchesPayment =
      paymentMethodFilter === 'all' || transaction.paymentMethod === paymentMethodFilter;

    return matchesSearch && matchesCategory && matchesPayment;
  });

  const groupedTransactions = visibleTransactions.reduce<
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
    if (
      !isEditorOpen ||
      editorMode !== 'create' ||
      formValues.categoryId ||
      categories.length === 0
    ) {
      return;
    }

    setFormValues((currentValues) => ({
      ...currentValues,
      categoryId: currentValues.categoryId || categories[0]?.id || '',
    }));
  }, [categories, editorMode, formValues.categoryId, isEditorOpen]);

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
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: field === 'paymentMethod' ? (value as PaymentMethod) : value,
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

      await queryClient.invalidateQueries({
        queryKey: ['transactions', 'expenses'],
      });
      closeEditor();
    } catch (error) {
      setFormError(resolveTransactionError(error, 'Unable to save the transaction right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (expenseId: string) => {
    setDeleteTargetId(expenseId);
    setListFeedback('');

    try {
      await deleteExpense(expenseId);
      await queryClient.invalidateQueries({
        queryKey: ['transactions', 'expenses'],
      });
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
              <Button
                disabled={categoriesQuery.isLoading || categories.length === 0}
                onClick={openCreateEditor}
                variant="secondary"
              >
                Add expense
              </Button>
            </>
          }
          description="Search, review, add, edit, and export live transactions."
          eyebrow="Transactions"
          meta={
            <>
              <Badge variant="info">{formatMonthLabel(monthFilter)}</Badge>
              <Badge variant="neutral">
                {expensesQuery.isLoading ? 'Syncing' : `${visibleTransactions.length} visible`}
              </Badge>
            </>
          }
          title="Track spending fast."
        />

        <section className="grid gap-4 xl:grid-cols-3">
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

        <SurfaceCard className="overflow-hidden rounded-[34px] px-5 py-5 md:px-6 md:py-6">
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),180px,180px,auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-11"
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search transactions"
                  value={searchValue}
                />
              </div>
              <Input
                onChange={(event) => setMonthFilter(event.target.value)}
                type="month"
                value={monthFilter}
              />
              <select
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
              <Button
                disabled={categoriesQuery.isLoading || categories.length === 0}
                onClick={openCreateEditor}
                variant="secondary"
              >
                Add expense
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  categoryFilter === 'all'
                    ? 'bg-brand text-white shadow-sm'
                    : 'border border-line bg-white text-slate-600 hover:border-brand/30 hover:text-ink',
                )}
                onClick={() => setCategoryFilter('all')}
                type="button"
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    categoryFilter === category.id
                      ? 'bg-brand text-white shadow-sm'
                      : 'border border-line bg-white text-slate-600 hover:border-brand/30 hover:text-ink',
                  )}
                  onClick={() => setCategoryFilter(category.id)}
                  type="button"
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="rounded-[28px] border border-brand/10 bg-[linear-gradient(140deg,rgba(15,123,113,0.08),rgba(255,255,255,0.92))] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <p className="kicker">Overview</p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">
                    Real transactions, faster cleanup.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Filter by month, narrow the list, and update expenses without leaving the page.
                  </p>
                </div>
                <Sparkles className="mt-1 h-5 w-5 shrink-0 text-brand" />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Spend
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">{formatMoney(totalVisible)}</p>
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Review
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    {flaggedCount} flagged charge{flaggedCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Add
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">Live modal</p>
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Export
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">Filtered CSV</p>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Transaction list</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Latest activity
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                Every row is editable and backed by the API.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">{formatMonthLabel(monthFilter)}</Badge>
              <Badge variant="info">
                {searchValue || categoryFilter !== 'all' || paymentMethodFilter !== 'all'
                  ? 'Filtered'
                  : 'All rows'}
              </Badge>
              <Button
                disabled={categoriesQuery.isLoading || categories.length === 0}
                onClick={openCreateEditor}
                variant="secondary"
              >
                Add expense
              </Button>
            </div>
          </div>

          {categoriesQuery.isError ? (
            <div className="mt-5 rounded-[22px] border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
              {resolveTransactionError(
                categoriesQuery.error,
                'Unable to load categories right now.',
              )}
            </div>
          ) : null}

          {expensesQuery.isError ? (
            <div className="mt-5 rounded-[22px] border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
              {resolveTransactionError(
                expensesQuery.error,
                'Unable to load transactions right now.',
              )}
            </div>
          ) : null}

          {listFeedback ? (
            <div
              className={cn(
                'mt-5 rounded-[22px] px-4 py-4 text-sm',
                listFeedback.toLowerCase().includes('unable')
                  ? 'border border-danger/20 bg-danger/10 text-danger'
                  : 'border border-brand/15 bg-brand/10 text-slate-700',
              )}
            >
              {listFeedback}
            </div>
          ) : null}

          {expensesQuery.isLoading ? (
            <div className="mt-5 space-y-6">
              {Array.from({ length: 3 }).map((_, groupIndex) => (
                <div key={groupIndex}>
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-3 w-24 rounded-full" />
                    <Skeleton className="h-3 w-16 rounded-full" />
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {Array.from({ length: 2 }).map((_, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="rounded-[22px] border border-white/80 bg-white/88 px-3.5 py-3"
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
            <div className="mt-5 space-y-6">
              {groupedTransactions.map((group) => {
                const groupTotal = group.items.reduce((total, item) => total + item.amount, 0);

                return (
                  <div key={group.key}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {group.label}
                      </p>
                      <p className="text-sm font-medium text-slate-500">
                        {formatMoney(groupTotal)}
                      </p>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      {group.items.map((transaction) => (
                        <article
                          key={transaction.id}
                          className="rounded-[22px] border border-white/80 bg-white/88 px-3.5 py-3"
                        >
                          <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex min-w-0 items-center gap-3.5">
                              <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] text-sm font-semibold"
                                style={categoryTone(transaction.categoryColor)}
                              >
                                {transaction.description.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-[15px] font-semibold text-ink">
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
                                <p className="mt-1 text-sm text-slate-500">
                                  {transaction.notes?.trim() || 'No notes added.'}
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-3 xl:flex xl:items-center xl:gap-2.5">
                              <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2 xl:min-w-[112px]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  Date
                                </p>
                                <p className="mt-1 text-sm font-medium text-ink">
                                  {formatShortDate(transaction.date)}
                                </p>
                              </div>
                              <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2 xl:min-w-[156px]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  Method
                                </p>
                                <p className="mt-1 text-sm font-medium text-ink">
                                  {paymentMethodLabels[transaction.paymentMethod]}
                                </p>
                              </div>
                              <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2 xl:min-w-[168px]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  Updated
                                </p>
                                <p className="mt-1 text-sm font-medium text-ink">
                                  {formatShortDate(transaction.updatedAt)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2.5 xl:min-w-[204px] xl:items-end">
                              <div className="xl:text-right">
                                <p className="text-lg font-semibold text-ink">
                                  {formatMoney(transaction.amount)}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {transaction.alert
                                    ? 'Review'
                                    : transaction.recurring
                                      ? 'Recurring hint'
                                      : 'Normal'}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                                  onClick={() => openEditEditor(transaction)}
                                  type="button"
                                >
                                  <span className="inline-flex items-center gap-1.5">
                                    <PencilLine className="h-3.5 w-3.5" />
                                    Edit
                                  </span>
                                </button>
                                <button
                                  className="rounded-full border border-danger/20 bg-white px-3 py-1.5 text-xs font-semibold text-danger transition hover:border-danger/40 hover:bg-danger/5"
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
                searchValue || categoryFilter !== 'all' || paymentMethodFilter !== 'all'
                  ? 'Try clearing one of the filters or searching with broader terms.'
                  : `No transactions found for ${formatMonthLabel(monthFilter)} yet.`
              }
              icon={Search}
              title={
                searchValue || categoryFilter !== 'all' || paymentMethodFilter !== 'all'
                  ? 'No transactions match this view'
                  : 'No transactions yet'
              }
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
