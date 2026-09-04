'use client';

import {
  type Category,
  createRecurringExpenseSchema,
  type Expense,
  formatShortDate,
  type PaymentMethod,
  type RecurringCadence,
  type RecurringExpense,
} from '@spendwise/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  Check,
  CircleX,
  PencilLine,
  Plus,
  Power,
  Repeat2,
  Sparkles,
  Trash2,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
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
import { useCurrentUserQuery } from '@/lib/auth/client';
import { formatMoney as baseFormatMoney } from '@/lib/formatters';
import {
  createRecurringExpense,
  deleteRecurringExpense,
  listSavedRecurring,
  savedRecurringQueryKey,
  updateRecurringExpense,
} from '@/lib/recurring/client';
import { listExpenses, listTransactionCategories } from '@/lib/transactions/client';
import { cn } from '@/lib/utils';

type RecurringStatus = 'upcoming' | 'renewing' | 'paused';
type RecurringFilter = 'all' | 'saved' | 'upcoming' | 'paused';
type RecurringEditorMode = 'create' | 'edit';

type RecurringFormField =
  | 'description'
  | 'amount'
  | 'categoryId'
  | 'cadence'
  | 'nextDueDate'
  | 'paymentMethod'
  | 'notes';

interface RecurringFormValues {
  description: string;
  amount: string;
  categoryId: string;
  cadence: RecurringCadence;
  nextDueDate: string;
  paymentMethod: PaymentMethod;
  isActive: boolean;
  notes: string;
}

type RecurringFieldErrors = Partial<Record<RecurringFormField, string>>;

interface CadenceSpec {
  kind: RecurringCadence;
  label: string;
  everyDays: number;
  tolerance: number;
  monthlyFactor: number;
  upcomingWindowDays: number;
  pauseGraceDays: number;
  monthStep?: number;
}

interface RecurringSeries {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  averageAmount: number;
  lastAmount: number;
  nextCharge: string;
  lastCharge: string;
  frequency: string;
  cadenceKind: RecurringCadence;
  paymentMethod: PaymentMethod;
  status: RecurringStatus;
  cadenceDays: number;
  monthlyCost: number;
  transactionCount: number;
  confidence: number;
  dueInDays: number;
  notes?: string;
  isSaved?: boolean;
}

const recurringExpensesQueryKey = ['recurring', 'expenses'] as const;
const recurringCategoriesQueryKey = ['recurring', 'categories'] as const;

const recurringHintPattern =
  /(subscription|membership|rent|renewal|bill|utility|utilities|mortgage|gym|monthly|insurance|plan|dues|stream|internet|phone)/i;

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  credit_card: 'Credit card',
  debit_card: 'Debit card',
  bank_transfer: 'Bank transfer',
  e_wallet: 'E-wallet',
};

const cadenceLabels: Record<RecurringCadence, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const cadenceSpecs: CadenceSpec[] = [
  {
    kind: 'weekly',
    label: 'Weekly',
    everyDays: 7,
    tolerance: 2,
    monthlyFactor: 52 / 12,
    upcomingWindowDays: 4,
    pauseGraceDays: 6,
  },
  {
    kind: 'biweekly',
    label: 'Every 2 weeks',
    everyDays: 14,
    tolerance: 3,
    monthlyFactor: 26 / 12,
    upcomingWindowDays: 5,
    pauseGraceDays: 8,
  },
  {
    kind: 'monthly',
    label: 'Monthly',
    everyDays: 30,
    tolerance: 5,
    monthlyFactor: 1,
    upcomingWindowDays: 10,
    pauseGraceDays: 12,
    monthStep: 1,
  },
  {
    kind: 'quarterly',
    label: 'Quarterly',
    everyDays: 91,
    tolerance: 12,
    monthlyFactor: 1 / 3,
    upcomingWindowDays: 14,
    pauseGraceDays: 20,
    monthStep: 3,
  },
  {
    kind: 'yearly',
    label: 'Yearly',
    everyDays: 365,
    tolerance: 20,
    monthlyFactor: 1 / 12,
    upcomingWindowDays: 30,
    pauseGraceDays: 45,
    monthStep: 12,
  },
];

const recurringPresets = [
  { title: 'Apartment rent', cadence: 'monthly' as const, note: 'Monthly rent transfer' },
  { title: 'Gym membership', cadence: 'monthly' as const, note: 'Fitness recurring pass' },
  { title: 'Cloud storage', cadence: 'yearly' as const, note: 'Annual cloud backup' },
  { title: 'Internet utility', cadence: 'monthly' as const, note: 'Fiber broadband plan' },
  { title: 'Streaming subscription', cadence: 'monthly' as const, note: 'Entertainment pass' },
] as const;

const getDefaultFormValues = (defaultCategoryId = ''): RecurringFormValues => ({
  description: '',
  amount: '',
  categoryId: defaultCategoryId,
  cadence: 'monthly',
  nextDueDate: new Date().toISOString().slice(0, 10),
  paymentMethod: 'credit_card',
  isActive: true,
  notes: '',
});

const normalizeDescription = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b\d+\b/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const average = (values: number[]) =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const getDifferenceInDays = (later: Date, earlier: Date) =>
  Math.round((later.getTime() - earlier.getTime()) / 86_400_000);

const addDays = (value: Date, days: number) => {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const addMonthsPreservingUtcDay = (value: Date, months: number) => {
  const next = new Date(value);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const toTitleCase = (value: string) =>
  value.replace(
    /\w\S*/g,
    (part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`,
  );

const getMostCommonValue = <T,>(items: T[]) => {
  const counts = new Map<T, number>();

  items.forEach((item) => {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  });

  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? items[0];
};

const resolveCadence = (intervals: number[], hasHint: boolean) => {
  if (intervals.length === 0) {
    return null;
  }

  const ranked = cadenceSpecs
    .map((spec) => {
      const averageDrift = average(
        intervals.map((interval) => Math.abs(interval - spec.everyDays)),
      );
      const withinTolerance = intervals.filter(
        (interval) => Math.abs(interval - spec.everyDays) <= spec.tolerance,
      ).length;
      const intervalScore = withinTolerance / intervals.length;
      const driftScore = clamp(1 - averageDrift / (spec.tolerance * 2), 0, 1);
      const score = intervalScore * 0.7 + driftScore * 0.3;

      return {
        spec,
        score,
        intervalScore,
      };
    })
    .sort((left, right) => right.score - left.score);

  const best = ranked[0];

  if (!best) {
    return null;
  }

  if (!hasHint && best.spec.kind === 'weekly' && intervals.length < 2) {
    return null;
  }

  if (best.score < (hasHint ? 0.42 : 0.54)) {
    return null;
  }

  if (!hasHint && best.intervalScore < 0.5) {
    return null;
  }

  return best.spec;
};

const getRecurringStatus = (nextCharge: Date, cadence: CadenceSpec, now: Date) => {
  const dueInDays = getDifferenceInDays(nextCharge, now);

  if (dueInDays < -cadence.pauseGraceDays) {
    return {
      status: 'paused' as const,
      dueInDays,
    };
  }

  if (dueInDays <= cadence.upcomingWindowDays) {
    return {
      status: 'upcoming' as const,
      dueInDays,
    };
  }

  return {
    status: 'renewing' as const,
    dueInDays,
  };
};

const getDueLabel = (dueInDays: number) => {
  if (dueInDays < 0) {
    return `${Math.abs(dueInDays)} day${Math.abs(dueInDays) === 1 ? '' : 's'} overdue`;
  }

  if (dueInDays === 0) {
    return 'Due today';
  }

  if (dueInDays === 1) {
    return 'Due tomorrow';
  }

  return `Due in ${dueInDays} days`;
};

const getCadenceMonthlyFactor = (cadence: RecurringCadence) => {
  switch (cadence) {
    case 'weekly':
      return 52 / 12;
    case 'biweekly':
      return 26 / 12;
    case 'monthly':
      return 1;
    case 'quarterly':
      return 1 / 3;
    case 'yearly':
      return 1 / 12;
    default:
      return 1;
  }
};

const resolveRecurringError = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const detectRecurringSeries = (expenses: Expense[], categories: Category[]) => {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const groups = new Map<string, Expense[]>();

  expenses.forEach((expense) => {
    const normalized = normalizeDescription(expense.description);

    if (!normalized) {
      return;
    }

    const key = `${expense.categoryId}:${normalized}`;
    const current = groups.get(key) ?? [];
    current.push(expense);
    groups.set(key, current);
  });

  const now = new Date();
  const series: RecurringSeries[] = [];

  Array.from(groups.values()).forEach((groupExpenses) => {
    const ordered = [...groupExpenses].sort(
      (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
    );

    if (ordered.length < 2) {
      const single = ordered[0];
      if (!single) return;

      const hasHint = recurringHintPattern.test(`${single.description} ${single.notes ?? ''}`);
      if (hasHint) {
        const lastChargeDate = new Date(single.date);
        const monthlyCadence =
          cadenceSpecs.find((spec) => spec.kind === 'monthly') ?? cadenceSpecs[2]!;
        const nextChargeDate = addMonthsPreservingUtcDay(lastChargeDate, 1);
        const { status, dueInDays } = getRecurringStatus(nextChargeDate, monthlyCadence, now);
        const dominantCategory = categoryById.get(single.categoryId);

        series.push({
          id: `${single.categoryId}:${normalizeDescription(single.description)}`,
          name: toTitleCase(normalizeDescription(single.description)),
          categoryId: single.categoryId,
          categoryName: dominantCategory?.name ?? 'Uncategorized',
          averageAmount: roundMoney(single.amount),
          lastAmount: roundMoney(single.amount),
          nextCharge: nextChargeDate.toISOString(),
          lastCharge: single.date,
          frequency: 'Monthly (Suggested)',
          cadenceKind: 'monthly',
          paymentMethod: single.paymentMethod,
          status,
          cadenceDays: 30,
          monthlyCost: roundMoney(single.amount),
          transactionCount: 1,
          confidence: 0.68,
          dueInDays,
          notes: single.notes,
        });
      }
      return;
    }

    const intervals = ordered.slice(1).map((expense, index) => {
      const currentDate = new Date(expense.date);
      const previousExpense = ordered[index];

      return previousExpense ? getDifferenceInDays(currentDate, new Date(previousExpense.date)) : 0;
    });

    const averageAmount = average(ordered.map((expense) => expense.amount));
    const amountDrift =
      averageAmount > 0
        ? average(
            ordered.map((expense) => Math.abs(expense.amount - averageAmount) / averageAmount),
          )
        : 0;
    const hasHint = ordered.some((expense) =>
      recurringHintPattern.test(`${expense.description} ${expense.notes ?? ''}`),
    );
    const cadence = resolveCadence(intervals, hasHint);

    if (!cadence) {
      return;
    }

    if (!hasHint && amountDrift > 0.22 && ordered.length < 4) {
      return;
    }

    const lastExpense = ordered[ordered.length - 1];

    if (!lastExpense) {
      return;
    }

    const lastChargeDate = new Date(lastExpense.date);
    const staleCutoff = Math.max(cadence.everyDays * 6, 540);

    if (getDifferenceInDays(now, lastChargeDate) > staleCutoff) {
      return;
    }

    const nextChargeDate = cadence.monthStep
      ? addMonthsPreservingUtcDay(lastChargeDate, cadence.monthStep)
      : addDays(lastChargeDate, cadence.everyDays);
    const { status, dueInDays } = getRecurringStatus(nextChargeDate, cadence, now);
    const intervalAccuracy = clamp(
      1 -
        average(intervals.map((interval) => Math.abs(interval - cadence.everyDays))) /
          (cadence.tolerance * 2),
      0,
      1,
    );
    const amountAccuracy = clamp(1 - amountDrift / 0.35, 0, 1);
    const historyBonus = clamp((ordered.length - 1) / 4, 0, 1);
    const confidence = clamp(
      0.44 +
        intervalAccuracy * 0.28 +
        amountAccuracy * 0.18 +
        historyBonus * 0.08 +
        (hasHint ? 0.07 : 0),
      0.5,
      0.98,
    );
    const dominantCategory = categoryById.get(lastExpense.categoryId);
    const dominantPaymentMethod =
      getMostCommonValue(ordered.map((expense) => expense.paymentMethod)) ??
      lastExpense.paymentMethod;

    series.push({
      id: `${lastExpense.categoryId}:${normalizeDescription(lastExpense.description)}`,
      name: toTitleCase(normalizeDescription(lastExpense.description)),
      categoryId: lastExpense.categoryId,
      categoryName: dominantCategory?.name ?? 'Uncategorized',
      averageAmount: roundMoney(averageAmount),
      lastAmount: roundMoney(lastExpense.amount),
      nextCharge: nextChargeDate.toISOString(),
      lastCharge: lastExpense.date,
      frequency: cadence.label,
      cadenceKind: cadence.kind,
      paymentMethod: dominantPaymentMethod,
      status,
      cadenceDays: cadence.everyDays,
      monthlyCost: roundMoney(averageAmount * cadence.monthlyFactor),
      transactionCount: ordered.length,
      confidence,
      dueInDays,
      notes: lastExpense.notes,
    });
  });

  return series.sort((left, right) => {
    const statusRank = { upcoming: 0, renewing: 1, paused: 2 } as const;
    const statusDifference = statusRank[left.status] - statusRank[right.status];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    return new Date(left.nextCharge).getTime() - new Date(right.nextCharge).getTime();
  });
};

function RecurringEditorModal({
  categories,
  fieldErrors,
  formError,
  formValues,
  isSubmitting,
  mode,
  onClose,
  onFieldChange,
  onPresetSelect,
  onSubmit,
}: {
  categories: Category[];
  fieldErrors: RecurringFieldErrors;
  formError: string;
  formValues: RecurringFormValues;
  isSubmitting: boolean;
  mode: RecurringEditorMode;
  onClose: () => void;
  onFieldChange: (field: RecurringFormField, value: string | boolean) => void;
  onPresetSelect: (preset: (typeof recurringPresets)[number]) => void;
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
            <p className="kicker">{mode === 'create' ? 'New schedule' : 'Edit schedule'}</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">
              {mode === 'create' ? 'Save recurring schedule' : 'Update recurring schedule'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Saved schedules run automatically in the database and keep your recurring forecast
              synchronized.
            </p>
          </div>
          <button
            aria-label="Close recurring editor"
            className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-line bg-paper-strong text-ink-soft transition hover:border-brand/30 hover:text-ink"
            onClick={onClose}
            type="button"
          >
            <CircleX className="h-5 w-5" />
          </button>
        </div>

        {mode === 'create' ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {recurringPresets.map((preset) => (
              <button
                key={preset.title}
                className="rounded-full border border-line bg-paper-strong px-3.5 py-2 text-sm font-semibold text-ink-soft transition hover:border-brand/30 hover:text-ink"
                onClick={() => onPresetSelect(preset)}
                type="button"
              >
                {preset.title}
              </button>
            ))}
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Description / Service</span>
            <Input
              className={cn(fieldErrors.description && 'border-danger focus:border-danger')}
              onChange={(event) => onFieldChange('description', event.target.value)}
              placeholder="e.g. Netflix, Gym, Apartment Rent"
              value={formValues.description}
            />
            {fieldErrors.description ? (
              <p className="text-sm text-danger">{fieldErrors.description}</p>
            ) : null}
          </label>

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
                className={cn(
                  'h-11 w-full rounded-[18px] border border-line bg-paper px-4 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10',
                  fieldErrors.categoryId && 'border-danger focus:border-danger',
                )}
                onChange={(event) => onFieldChange('categoryId', event.target.value)}
                value={formValues.categoryId}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
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
              <span>Billing frequency</span>
              <select
                className="h-11 w-full rounded-[18px] border border-line bg-paper px-4 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                onChange={(event) =>
                  onFieldChange('cadence', event.target.value as RecurringCadence)
                }
                value={formValues.cadence}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Next due date</span>
              <Input
                className={cn(fieldErrors.nextDueDate && 'border-danger focus:border-danger')}
                onChange={(event) => onFieldChange('nextDueDate', event.target.value)}
                type="date"
                value={formValues.nextDueDate}
              />
              {fieldErrors.nextDueDate ? (
                <p className="text-sm text-danger">{fieldErrors.nextDueDate}</p>
              ) : null}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Payment method</span>
              <select
                className="h-11 w-full rounded-[18px] border border-line bg-paper px-4 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                onChange={(event) =>
                  onFieldChange('paymentMethod', event.target.value as PaymentMethod)
                }
                value={formValues.paymentMethod}
              >
                <option value="credit_card">Credit card</option>
                <option value="debit_card">Debit card</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="e_wallet">E-wallet</option>
                <option value="cash">Cash</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Short tag / memo</span>
              <Input
                onChange={(event) => onFieldChange('notes', event.target.value)}
                placeholder="e.g. Shared plan, Autopay on"
                value={formValues.notes}
              />
            </label>
          </div>

          {formError ? (
            <div className="rounded-[20px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {formError}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button disabled={isSubmitting} type="submit" variant="secondary">
              {isSubmitting
                ? mode === 'create'
                  ? 'Saving...'
                  : 'Updating...'
                : mode === 'create'
                  ? 'Save recurring schedule'
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

export default function RecurringPage() {
  const queryClient = useQueryClient();
  const { confirmDelete } = useConfirm();
  const { data: user } = useCurrentUserQuery();
  const formatMoney = (amount: number) => baseFormatMoney(amount, user?.currency ?? 'PHP');

  const [statusFilter, setStatusFilter] = useState<RecurringFilter>('all');
  const [searchValue, setSearchValue] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<RecurringEditorMode>('create');
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<RecurringFormValues>(getDefaultFormValues());
  const [fieldErrors, setFieldErrors] = useState<RecurringFieldErrors>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  // 1. Live saved recurring expenses from backend database
  const savedQuery = useQuery({
    queryKey: savedRecurringQueryKey,
    queryFn: listSavedRecurring,
  });

  // 2. Transaction history for zero-token local heuristic detection
  const expensesQuery = useQuery({
    queryKey: recurringExpensesQueryKey,
    queryFn: () => listExpenses({}),
  });

  // 3. Category metadata
  const categoriesQuery = useQuery({
    queryKey: recurringCategoriesQueryKey,
    queryFn: listTransactionCategories,
  });

  const categoryMap = useMemo(() => {
    return new Map((categoriesQuery.data ?? []).map((cat) => [cat.id, cat]));
  }, [categoriesQuery.data]);

  // Client-side heuristic detection
  const detectedSeries = useMemo(
    () => detectRecurringSeries(expensesQuery.data ?? [], categoriesQuery.data ?? []),
    [categoriesQuery.data, expensesQuery.data],
  );

  const savedList = useMemo(() => savedQuery.data ?? [], [savedQuery.data]);

  // Set of normalized descriptions that are already saved in DB
  const savedDescriptionSet = useMemo(() => {
    const set = new Set<string>();
    savedList.forEach((item) => {
      set.add(normalizeDescription(item.description));
    });
    return set;
  }, [savedList]);

  // Annotate detected series with saved status
  const annotatedDetectedSeries = useMemo(() => {
    return detectedSeries.map((series) => ({
      ...series,
      isSaved: savedDescriptionSet.has(normalizeDescription(series.name)),
    }));
  }, [detectedSeries, savedDescriptionSet]);

  // Calculate Saved Recurring views
  const savedViews = useMemo(() => {
    const now = new Date();
    return savedList.map((item) => {
      const nextDate = new Date(item.nextDueDate);
      const dueInDays = getDifferenceInDays(nextDate, now);
      const monthlyCost = roundMoney(item.amount * getCadenceMonthlyFactor(item.cadence));
      const category = categoryMap.get(item.categoryId);

      return {
        ...item,
        categoryName: category?.name ?? 'General',
        dueInDays,
        monthlyCost,
        status: !item.isActive
          ? ('paused' as const)
          : dueInDays <= 10
            ? ('upcoming' as const)
            : ('renewing' as const),
      };
    });
  }, [savedList, categoryMap]);

  // Filtered saved schedules
  const visibleSaved = useMemo(() => {
    return savedViews.filter((item) => {
      const matchesSearch =
        !searchValue ||
        `${item.description} ${item.categoryName} ${cadenceLabels[item.cadence]} ${paymentMethodLabels[item.paymentMethod] || ''} ${item.notes || ''}`
          .toLowerCase()
          .includes(searchValue.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        statusFilter === 'saved' ||
        (statusFilter === 'upcoming' && item.status === 'upcoming') ||
        (statusFilter === 'paused' && item.status === 'paused');

      return matchesSearch && matchesStatus;
    });
  }, [savedViews, searchValue, statusFilter]);

  // Filtered detected series
  const visibleDetected = useMemo(() => {
    return annotatedDetectedSeries.filter((series) => {
      const matchesSearch =
        !searchValue ||
        `${series.name} ${series.categoryName} ${series.frequency} ${paymentMethodLabels[series.paymentMethod]}`
          .toLowerCase()
          .includes(searchValue.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'upcoming' && series.status === 'upcoming') ||
        (statusFilter === 'paused' && series.status === 'paused');

      return matchesSearch && matchesStatus;
    });
  }, [annotatedDetectedSeries, searchValue, statusFilter]);

  // Pagination state
  const [savedPage, setSavedPage] = useState(1);
  const [savedPageSize] = useState(6);
  const [detectedPage, setDetectedPage] = useState(1);
  const [detectedPageSize] = useState(5);

  useEffect(() => {
    setSavedPage(1);
    setDetectedPage(1);
  }, [searchValue, statusFilter]);

  const totalSavedPages = Math.max(1, Math.ceil(visibleSaved.length / savedPageSize));
  const paginatedSaved = useMemo(() => {
    return visibleSaved.slice((savedPage - 1) * savedPageSize, savedPage * savedPageSize);
  }, [visibleSaved, savedPage, savedPageSize]);

  const totalDetectedPages = Math.max(1, Math.ceil(visibleDetected.length / detectedPageSize));
  const paginatedDetected = useMemo(() => {
    return visibleDetected.slice(
      (detectedPage - 1) * detectedPageSize,
      detectedPage * detectedPageSize,
    );
  }, [visibleDetected, detectedPage, detectedPageSize]);

  // Unified metrics
  const activeSavedMonthly = savedViews
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + s.monthlyCost, 0);
  const unsavedDetectedMonthly = detectedSeries
    .filter((s) => !s.isSaved && s.status !== 'paused')
    .reduce((sum, s) => sum + s.monthlyCost, 0);
  const totalMonthlyRecurring = activeSavedMonthly + unsavedDetectedMonthly;

  const totalUpcomingCount =
    savedViews.filter((s) => s.isActive && s.dueInDays >= 0 && s.dueInDays <= 10).length +
    detectedSeries.filter((d) => !d.isSaved && d.dueInDays >= 0 && d.dueInDays <= 10).length;

  const nextUpcomingSaved = savedViews
    .filter((s) => s.isActive && s.dueInDays >= 0)
    .sort((a, b) => a.dueInDays - b.dueInDays)[0];

  const nextUpcomingDetected = detectedSeries
    .filter((d) => !d.isSaved && d.dueInDays >= 0)
    .sort((a, b) => a.dueInDays - b.dueInDays)[0];

  const nextUpcomingItem =
    nextUpcomingSaved && nextUpcomingDetected
      ? nextUpcomingSaved.dueInDays <= nextUpcomingDetected.dueInDays
        ? {
            name: nextUpcomingSaved.description,
            date: nextUpcomingSaved.nextDueDate,
            due: nextUpcomingSaved.dueInDays,
          }
        : {
            name: nextUpcomingDetected.name,
            date: nextUpcomingDetected.nextCharge,
            due: nextUpcomingDetected.dueInDays,
          }
      : nextUpcomingSaved
        ? {
            name: nextUpcomingSaved.description,
            date: nextUpcomingSaved.nextDueDate,
            due: nextUpcomingSaved.dueInDays,
          }
        : nextUpcomingDetected
          ? {
              name: nextUpcomingDetected.name,
              date: nextUpcomingDetected.nextCharge,
              due: nextUpcomingDetected.dueInDays,
            }
          : null;

  // Editor Actions
  const openCreateModal = () => {
    setEditorMode('create');
    setEditingRecurringId(null);
    setFormValues(getDefaultFormValues(categoriesQuery.data?.[0]?.id || ''));
    setFieldErrors({});
    setFormError('');
    setIsEditorOpen(true);
  };

  const openEditModal = (item: RecurringExpense) => {
    setEditorMode('edit');
    setEditingRecurringId(item.id);
    setFormValues({
      description: item.description,
      amount: item.amount.toString(),
      categoryId: item.categoryId,
      cadence: item.cadence,
      nextDueDate: new Date(item.nextDueDate).toISOString().slice(0, 10),
      paymentMethod: item.paymentMethod,
      isActive: item.isActive,
      notes: item.notes || '',
    });
    setFieldErrors({});
    setFormError('');
    setIsEditorOpen(true);
  };

  const openSaveFromDetectedModal = (series: RecurringSeries) => {
    setEditorMode('create');
    setEditingRecurringId(null);
    setFormValues({
      description: series.name,
      amount: series.averageAmount.toString(),
      categoryId: series.categoryId || categoriesQuery.data?.[0]?.id || '',
      cadence: series.cadenceKind || 'monthly',
      nextDueDate: new Date(series.nextCharge).toISOString().slice(0, 10),
      paymentMethod: series.paymentMethod || 'credit_card',
      isActive: true,
      notes: series.notes || 'Detected from repeated charges',
    });
    setFieldErrors({});
    setFormError('');
    setIsEditorOpen(true);
  };

  const handleFieldChange = (field: RecurringFormField, value: string | boolean) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
    setFieldErrors((current) => ({
      ...current,
      [field]: '',
    }));
    setFormError('');
  };

  const handlePresetSelect = (preset: (typeof recurringPresets)[number]) => {
    setFormValues((current) => ({
      ...current,
      description: preset.title,
      cadence: preset.cadence,
      notes: preset.note,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      const payloadCandidate = {
        description: formValues.description.trim(),
        amount: Number(formValues.amount.replace(/[^\d.]/g, '')),
        categoryId: formValues.categoryId,
        cadence: formValues.cadence,
        nextDueDate: new Date(`${formValues.nextDueDate}T12:00:00Z`).toISOString(),
        paymentMethod: formValues.paymentMethod,
        isActive: formValues.isActive,
        notes: formValues.notes.trim() || undefined,
      };

      const result = createRecurringExpenseSchema.safeParse(payloadCandidate);

      if (!result.success) {
        const nextErrors: RecurringFieldErrors = {};
        Object.entries(result.error.flatten().fieldErrors).forEach(([field, msgs]) => {
          if (msgs?.[0]) nextErrors[field as RecurringFormField] = msgs[0];
        });
        setFieldErrors(nextErrors);
        setFormError('Please resolve highlighted fields before saving.');
        setIsSubmitting(false);
        return;
      }

      if (editorMode === 'create') {
        await createRecurringExpense(result.data);
        setBannerMessage(`"${result.data.description}" recurring schedule saved.`);
      } else if (editingRecurringId) {
        await updateRecurringExpense(editingRecurringId, result.data);
        setBannerMessage(`"${result.data.description}" updated successfully.`);
      }

      await queryClient.invalidateQueries({ queryKey: savedRecurringQueryKey });
      setIsEditorOpen(false);
    } catch (error) {
      setFormError(resolveRecurringError(error, 'Unable to save recurring schedule.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: RecurringExpense) => {
    try {
      const nextActive = !item.isActive;
      await updateRecurringExpense(item.id, { isActive: nextActive });
      await queryClient.invalidateQueries({ queryKey: savedRecurringQueryKey });
      setBannerMessage(
        nextActive
          ? `"${item.description}" resumed and active.`
          : `"${item.description}" paused. Auto-creation suspended.`,
      );
    } catch (error) {
      setBannerMessage(resolveRecurringError(error, 'Failed to update schedule status.'));
    }
  };

  const handleDelete = async (item: RecurringExpense) => {
    const confirmed = await confirmDelete({
      itemName: item.description,
      title: `Delete recurring schedule?`,
      description: `Are you sure you want to delete "${item.description}"? SpendWise will stop tracking this schedule in your recurring ledger.`,
    });

    if (!confirmed) return;

    try {
      await deleteRecurringExpense(item.id);
      await queryClient.invalidateQueries({ queryKey: savedRecurringQueryKey });
      setBannerMessage(`"${item.description}" deleted.`);
    } catch (error) {
      setBannerMessage(resolveRecurringError(error, 'Failed to delete recurring schedule.'));
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: savedRecurringQueryKey }),
      queryClient.invalidateQueries({ queryKey: recurringExpensesQueryKey }),
      queryClient.invalidateQueries({ queryKey: recurringCategoriesQueryKey }),
    ]);
  };

  const isLoading = savedQuery.isLoading || expensesQuery.isLoading || categoriesQuery.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button onClick={openCreateModal} variant="secondary">
              <Plus className="h-4 w-4 mr-1.5" />
              Add recurring
            </Button>
            <Button disabled={isLoading} onClick={() => void handleRefresh()} variant="soft">
              Refresh
            </Button>
            <Button asChild variant="secondary">
              <Link href="/transactions">Review transactions</Link>
            </Button>
          </>
        }
        description="Manage persistent recurring schedules and review smart pattern detections."
        eyebrow="Recurring Spend"
        meta={
          <>
            <Badge variant="success">{savedList.length} saved schedules</Badge>
            <Badge variant="info">{detectedSeries.length} patterns detected</Badge>
          </>
        }
        title="Track recurring subscriptions & bills."
      />

      {bannerMessage ? (
        <div className="flex items-center justify-between rounded-[22px] border border-brand/20 bg-brand/10 px-5 py-3.5 text-sm text-ink animate-in fade-in">
          <div className="flex items-center gap-2.5 font-medium">
            <Sparkles className="h-4.5 w-4.5 text-brand shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <button
            className="text-xs font-semibold text-ink-soft hover:text-ink"
            onClick={() => setBannerMessage('')}
            type="button"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-3">
        <MetricCard
          delta={`${savedList.filter((s) => s.isActive).length} active schedules`}
          helper="Calculated monthly obligation"
          icon={Wallet}
          label="Recurring spend"
          value={formatMoney(totalMonthlyRecurring)}
        />
        <MetricCard
          delta={totalUpcomingCount ? `${totalUpcomingCount} due soon` : 'Nothing due soon'}
          helper="Next 10 days window"
          icon={CalendarClock}
          label="Upcoming charges"
          tone="mint"
          value={totalUpcomingCount.toString()}
        />
        <MetricCard
          delta={
            nextUpcomingItem
              ? `${nextUpcomingItem.name} (${getDueLabel(nextUpcomingItem.due).toLowerCase()})`
              : 'None upcoming'
          }
          helper="Next payment on calendar"
          icon={Repeat2}
          label="Next scheduled"
          value={nextUpcomingItem ? formatShortDate(nextUpcomingItem.date) : 'None'}
        />
      </section>

      <SurfaceCard className="overflow-hidden rounded-[34px] px-5 py-5 md:px-6 md:py-6">
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),auto]">
            <Input
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search recurring by service, category, cadence, or notes..."
              value={searchValue}
            />
            <Button onClick={openCreateModal} variant="secondary">
              <Plus className="h-4 w-4 mr-1.5" />
              New recurring bill
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ['all', 'All'],
              ['saved', `Saved schedules (${savedList.length})`],
              ['upcoming', 'Due soon'],
              ['paused', 'Paused / overdue'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  statusFilter === value
                    ? 'bg-brand text-white shadow-sm'
                    : 'border border-line bg-paper-strong text-ink-soft hover:border-brand/30 hover:text-ink',
                )}
                onClick={() => setStatusFilter(value as RecurringFilter)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </SurfaceCard>

      {/* Saved Recurring Schedules Card */}
      <SurfaceCard className="rounded-[30px] p-5 md:p-6 space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line/70 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-ink">Saved recurring schedules</h2>
              <Badge variant="info">{savedList.length}</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              Active schedules stored in your database. Automated transactions generate on their due
              dates.
            </p>
          </div>
          <Button onClick={openCreateModal} size="sm" variant="secondary">
            <Plus className="h-4 w-4 mr-1.5" />
            Add schedule
          </Button>
        </div>

        {savedQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="rounded-[24px] border border-line bg-paper p-5 space-y-3">
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-4 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : visibleSaved.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
              {paginatedSaved.map((item) => (
                <article
                  key={item.id}
                  className={cn(
                    'relative flex flex-col justify-between rounded-[26px] border bg-paper p-5 transition hover:shadow-sm',
                    item.isActive ? 'border-line' : 'border-line/60 opacity-75 bg-paper/60',
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-ink text-base truncate">
                            {item.description}
                          </p>
                          <Badge variant={item.isActive ? 'success' : 'neutral'}>
                            {item.isActive ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-ink-soft">
                          {cadenceLabels[item.cadence]} • {item.categoryName}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-ink">{formatMoney(item.amount)}</p>
                        <p className="text-[11px] font-medium text-ink-soft">
                          ~{formatMoney(item.monthlyCost)}/mo
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[18px] border border-line bg-paper-strong p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-ink-soft">
                        <span className="font-medium">Next Due</span>
                        <span className="font-semibold text-ink">
                          {formatShortDate(item.nextDueDate)} ({getDueLabel(item.dueInDays)})
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-ink-soft">
                        <span className="font-medium">Payment Method</span>
                        <span className="font-medium text-ink">
                          {paymentMethodLabels[item.paymentMethod]}
                        </span>
                      </div>
                      {item.notes ? (
                        <div className="pt-1 text-[11px] text-ink-soft italic border-t border-line/50 truncate">
                          {item.notes}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
                    <button
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full transition',
                        item.isActive
                          ? 'text-warning hover:bg-warning/10'
                          : 'text-success hover:bg-success/10',
                      )}
                      onClick={() => void handleToggleActive(item)}
                      type="button"
                    >
                      <Power className="h-3.5 w-3.5" />
                      <span>{item.isActive ? 'Pause' : 'Resume'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <Button
                        aria-label={`Edit ${item.description}`}
                        onClick={() => openEditModal(item)}
                        size="sm"
                        variant="ghost"
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button
                        aria-label={`Delete ${item.description}`}
                        className="text-danger hover:text-danger hover:bg-danger/10"
                        onClick={() => void handleDelete(item)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="pt-3 border-t border-line/60">
              <Pagination
                alwaysShow
                currentPage={savedPage}
                onPageChange={setSavedPage}
                pageSize={savedPageSize}
                totalItems={visibleSaved.length}
                totalPages={totalSavedPages}
              />
            </div>
          </div>
        ) : (
          <EmptyState
            action={
              <Button onClick={openCreateModal} variant="secondary">
                <Plus className="h-4 w-4 mr-1.5" />
                Add your first schedule
              </Button>
            }
            className="rounded-[24px] px-5 py-6"
            description="No saved recurring schedules found. Add subscriptions, rent, or utilities to automate your monthly budgeting."
            icon={Repeat2}
            title="No saved recurring schedules"
          />
        )}
      </SurfaceCard>

      {/* Detected Suggestions Card */}
      <SurfaceCard className="rounded-[30px] p-5 md:p-6 space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line/70 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-ink">Smart pattern detections</h2>
              <Badge variant="info">{detectedSeries.length} discovered</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              Discovered from your actual transaction intervals. Save them to automate tracking and
              midnight generation.
            </p>
          </div>
          <Button
            disabled={isLoading}
            onClick={() => void handleRefresh()}
            size="sm"
            variant="soft"
          >
            <Sparkles className="h-4 w-4 mr-1.5 text-brand" />
            Re-scan patterns
          </Button>
        </div>

        {expensesQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="rounded-[22px] border border-line bg-paper p-4">
                <Skeleton className="h-5 w-48 rounded-full" />
                <Skeleton className="mt-2 h-4 w-32 rounded-full" />
              </div>
            ))}
          </div>
        ) : visibleDetected.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-3">
              {paginatedDetected.map((series) => (
                <article
                  key={series.id}
                  className="rounded-[24px] border border-line bg-paper px-4 py-4 md:px-5 md:py-4 transition hover:border-brand/30"
                >
                  <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(240px,1fr),minmax(280px,1fr),auto] lg:items-center lg:gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-brand/10 text-brand">
                        <Repeat2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[15px] font-semibold text-ink">{series.name}</p>
                          {series.isSaved ? (
                            <Badge variant="success">
                              <Check className="h-3 w-3 mr-1" /> Saved schedule
                            </Badge>
                          ) : (
                            <Badge variant={series.status === 'upcoming' ? 'warning' : 'info'}>
                              {series.status === 'upcoming'
                                ? 'Upcoming renewal'
                                : 'Detected repeat'}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-ink-soft">
                          {series.frequency} • {series.categoryName} • {series.transactionCount}{' '}
                          charge{series.transactionCount === 1 ? '' : 's'} logged
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-[16px] border border-line bg-paper-strong px-3 py-2">
                        <p className="font-semibold uppercase tracking-wider text-ink-soft text-[10px]">
                          Avg Amount
                        </p>
                        <p className="mt-1 font-bold text-ink text-sm">
                          {formatMoney(series.averageAmount)}
                        </p>
                      </div>
                      <div className="rounded-[16px] border border-line bg-paper-strong px-3 py-2">
                        <p className="font-semibold uppercase tracking-wider text-ink-soft text-[10px]">
                          Predicted Next
                        </p>
                        <p className="mt-1 font-bold text-ink text-sm">
                          {formatShortDate(series.nextCharge)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      {series.isSaved ? (
                        <Button asChild size="sm" variant="soft">
                          <Link href="/transactions">Source transactions</Link>
                        </Button>
                      ) : (
                        <Button
                          onClick={() => openSaveFromDetectedModal(series)}
                          size="sm"
                          variant="secondary"
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          Save & Track
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="pt-3 border-t border-line/60">
              <Pagination
                alwaysShow
                currentPage={detectedPage}
                onPageChange={setDetectedPage}
                pageSize={detectedPageSize}
                totalItems={visibleDetected.length}
                totalPages={totalDetectedPages}
              />
            </div>
          </div>
        ) : (
          <EmptyState
            className="rounded-[24px] px-5 py-6"
            description="No repeating patterns detected from transactions yet. Once you log 2+ repeating expenses, they will appear here automatically."
            icon={Sparkles}
            title="No detected patterns yet"
          />
        )}
      </SurfaceCard>

      {/* Editor Modal */}
      {isEditorOpen ? (
        <RecurringEditorModal
          categories={categoriesQuery.data ?? []}
          fieldErrors={fieldErrors}
          formError={formError}
          formValues={formValues}
          isSubmitting={isSubmitting}
          mode={editorMode}
          onClose={() => setIsEditorOpen(false)}
          onFieldChange={handleFieldChange}
          onPresetSelect={handlePresetSelect}
          onSubmit={(e) => void handleSubmit(e)}
        />
      ) : null}
    </div>
  );
}
