'use client';

import { createBudgetSchema } from '@spendwise/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CircleAlert,
  CircleX,
  PencilLine,
  Plus,
  ShieldAlert,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SurfaceCard } from '@/components/ui/surface-card';
import {
  type BudgetSummaryItem,
  budgetSummaryQueryKey,
  deleteBudget,
  getBudgetSummary,
  upsertBudget,
} from '@/lib/budgets/client';
import { categoriesQueryKey, listCategories } from '@/lib/categories/client';
import { formatMoney } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type BudgetStatusFilter = 'all' | 'safe' | 'warning' | 'danger';
type BudgetField = 'categoryId' | 'limitAmount';

interface BudgetFormValues {
  categoryId: string;
  limitAmount: string;
}

type BudgetFieldErrors = Partial<Record<BudgetField, string>>;

const getInitialMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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

const getBudgetStatus = (budget: BudgetSummaryItem) => {
  if (budget.isOverBudget) {
    return 'danger' as const;
  }

  const utilization = budget.limitAmount > 0 ? budget.spent / budget.limitAmount : 0;

  if (utilization >= 0.8) {
    return 'warning' as const;
  }

  return 'safe' as const;
};

const getDefaultFormValues = (defaultCategoryId = ''): BudgetFormValues => ({
  categoryId: defaultCategoryId,
  limitAmount: '',
});

const parseAmountInput = (value: string) => Number(value.replace(/[^\d.]/g, ''));

const resolveBudgetError = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

function BudgetEditorModal({
  categories,
  fieldErrors,
  formError,
  formValues,
  isSubmitting,
  monthLabel,
  onClose,
  onFieldChange,
  onSubmit,
}: {
  categories: Array<{ id: string; name: string; color: string }>;
  fieldErrors: BudgetFieldErrors;
  formError: string;
  formValues: BudgetFormValues;
  isSubmitting: boolean;
  monthLabel: string;
  onClose: () => void;
  onFieldChange: (field: BudgetField, value: string) => void;
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
            <p className="kicker">Budget</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Create or update budget</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Budgets are saved per category for {monthLabel}. Saving the same category again will
              update that month&apos;s limit.
            </p>
          </div>
          <button
            aria-label="Close budget editor"
            className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-line bg-white text-slate-500 transition hover:border-brand/30 hover:text-ink"
            onClick={onClose}
            type="button"
          >
            <CircleX className="h-5 w-5" />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Category</span>
            <select
              className={cn(
                'flex h-12 w-full rounded-[20px] border border-line bg-white/80 px-4 text-sm text-ink shadow-sm outline-none transition focus:border-brand focus:bg-white',
                fieldErrors.categoryId && 'border-danger',
              )}
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

          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Monthly limit</span>
            <Input
              className={cn(fieldErrors.limitAmount && 'border-danger focus:border-danger')}
              onChange={(event) => onFieldChange('limitAmount', event.target.value)}
              placeholder="600"
              value={formValues.limitAmount}
            />
            {fieldErrors.limitAmount ? (
              <p className="text-sm text-danger">{fieldErrors.limitAmount}</p>
            ) : null}
          </label>

          {formError ? (
            <div className="rounded-[20px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {formError}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button disabled={isSubmitting} type="submit" variant="secondary">
              {isSubmitting ? 'Saving...' : 'Save budget'}
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

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);
  const [monthFilter, setMonthFilter] = useState(getInitialMonthValue);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<BudgetStatusFilter>('all');
  const [formValues, setFormValues] = useState<BudgetFormValues>(getDefaultFormValues());
  const [fieldErrors, setFieldErrors] = useState<BudgetFieldErrors>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState('');

  const activeMonth = parseMonthValue(monthFilter);
  const monthLabel = formatMonthLabel(monthFilter);

  const categoriesQuery = useQuery({
    queryKey: categoriesQueryKey,
    queryFn: listCategories,
  });
  const budgetSummary = useQuery({
    queryKey: budgetSummaryQueryKey(activeMonth.month, activeMonth.year),
    queryFn: () => getBudgetSummary(activeMonth.month, activeMonth.year),
  });

  const categories = categoriesQuery.data ?? [];
  const budgets = budgetSummary.data?.items ?? [];
  const budgetViews = useMemo(
    () =>
      budgets.map((budget) => {
        const category = categories.find((item) => item.id === budget.categoryId);
        const status = getBudgetStatus(budget);

        return {
          ...budget,
          status,
          categoryName: category?.name ?? 'Unknown category',
          categoryColor: category?.color ?? '#94A3B8',
        };
      }),
    [budgets, categories],
  );

  const visibleBudgets = budgetViews.filter((budget) => {
    const matchesSearch =
      !searchValue || budget.categoryName.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === 'all' || budget.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalBudgeted = visibleBudgets.reduce((total, budget) => total + budget.limitAmount, 0);
  const totalSpent = visibleBudgets.reduce((total, budget) => total + budget.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const atRiskCount = visibleBudgets.filter((budget) => budget.status !== 'safe').length;
  const safeCount = visibleBudgets.filter((budget) => budget.status === 'safe').length;
  const overBudgetItems = visibleBudgets.filter((budget) => budget.status === 'danger');
  const warningItems = visibleBudgets.filter((budget) => budget.status === 'warning');
  const forecastTone =
    totalBudgeted === 0 ? 'No budgets yet' : totalRemaining >= 0 ? 'Positive' : 'Tight';

  const resetForm = (defaultCategoryId = categories[0]?.id ?? '') => {
    setFormValues(getDefaultFormValues(defaultCategoryId));
    setFieldErrors({});
    setFormError('');
  };

  const openCreateBudget = () => {
    if (categoriesQuery.isError) {
      setPageMessage('Unable to load categories right now. Refresh the page and try again.');
      return;
    }

    if (categories.length === 0) {
      setPageMessage('Create or seed at least one category before adding a budget.');
      return;
    }

    resetForm();
    setIsCreateBudgetOpen(true);
  };

  const openEditBudget = (budget: (typeof budgetViews)[number]) => {
    setFormValues({
      categoryId: budget.categoryId,
      limitAmount: budget.limitAmount.toString(),
    });
    setFieldErrors({});
    setFormError('');
    setIsCreateBudgetOpen(true);
  };

  const closeBudgetModal = () => {
    setIsCreateBudgetOpen(false);
    resetForm();
  };

  const handleFieldChange = (field: BudgetField, value: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: '',
    }));
    setFormError('');
  };

  const buildValidatedPayload = () => {
    const candidate = {
      categoryId: formValues.categoryId,
      limitAmount: parseAmountInput(formValues.limitAmount),
      month: activeMonth.month,
      year: activeMonth.year,
    };

    const result = createBudgetSchema.safeParse(candidate);

    if (!result.success) {
      const nextErrors: BudgetFieldErrors = {};

      Object.entries(result.error.flatten().fieldErrors).forEach(([field, messages]) => {
        const firstMessage = messages?.[0];

        if (!firstMessage) {
          return;
        }

        if (field === 'categoryId' || field === 'limitAmount') {
          nextErrors[field] = firstMessage;
        }
      });

      setFieldErrors(nextErrors);
      setFormError('Please correct the highlighted fields before saving.');

      return null;
    }

    setFieldErrors({});
    return result.data;
  };

  const invalidateBudgets = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['budgets'],
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = buildValidatedPayload();

    if (!payload) {
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    setPageMessage('');

    try {
      await upsertBudget(payload);
      await invalidateBudgets();
      closeBudgetModal();
      setPageMessage('Budget saved.');
    } catch (error) {
      setFormError(resolveBudgetError(error, 'Unable to save the budget right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (budgetId: string) => {
    setDeleteTargetId(budgetId);
    setPageMessage('');

    try {
      await deleteBudget(budgetId);
      await invalidateBudgets();
      setPageMessage('Budget deleted.');
    } catch (error) {
      setPageMessage(resolveBudgetError(error, 'Unable to delete the budget right now.'));
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          actions={
            <>
              <Button variant="soft">Alerts</Button>
              <Button
                disabled={categoriesQuery.isLoading}
                onClick={openCreateBudget}
                variant="secondary"
              >
                Create budget
              </Button>
            </>
          }
          description="See what is safe, close, or over with live monthly budget data."
          eyebrow="Budgets"
          meta={
            <>
              <Badge variant="success">{safeCount} safe</Badge>
              <Badge variant="neutral">{monthLabel}</Badge>
            </>
          }
          title="Keep budgets on track."
        />

        <section className="grid gap-4 xl:grid-cols-3">
          <MetricCard
            delta={`${visibleBudgets.length} budgets`}
            helper="Current filtered view"
            icon={Target}
            label="Remaining budget"
            value={formatMoney(totalRemaining)}
          />
          <MetricCard
            delta={`${atRiskCount} at risk`}
            helper={`${safeCount} safe`}
            icon={ShieldAlert}
            label="Categories at risk"
            value={atRiskCount.toString()}
          />
          <MetricCard
            delta={`${formatMoney(totalSpent)} spent`}
            helper="Month-end outlook"
            icon={TrendingUp}
            label="End-of-month outlook"
            tone="mint"
            value={forecastTone}
          />
        </section>

        <SurfaceCard className="overflow-hidden rounded-[34px] px-5 py-5 md:px-6 md:py-6">
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),180px,auto]">
              <Input
                className="pl-4"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search budgets"
                value={searchValue}
              />
              <Input
                onChange={(event) => setMonthFilter(event.target.value)}
                type="month"
                value={monthFilter}
              />
              <Button
                disabled={categoriesQuery.isLoading}
                onClick={openCreateBudget}
                variant="secondary"
              >
                <Plus className="h-4 w-4" />
                Add budget
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ['all', 'All'],
                ['safe', 'Safe'],
                ['warning', 'Watch'],
                ['danger', 'Over'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    statusFilter === value
                      ? 'bg-brand text-white shadow-sm'
                      : 'border border-line bg-white text-slate-600 hover:border-brand/30 hover:text-ink',
                  )}
                  onClick={() => setStatusFilter(value as BudgetStatusFilter)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="rounded-[28px] border border-brand/10 bg-[linear-gradient(140deg,rgba(15,123,113,0.08),rgba(255,255,255,0.92))] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <p className="kicker">Overview</p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">
                    Budget health at a glance.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Totals, current pressure, and next-step signals update with the selected month.
                  </p>
                </div>
                <Target className="mt-1 h-5 w-5 shrink-0 text-brand" />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Budgeted
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    {formatMoney(totalBudgeted)}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Spent
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">{formatMoney(totalSpent)}</p>
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Next
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    {atRiskCount ? 'Review risk' : 'All steady'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Budget list</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Review budgets fast
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                Status, progress, and left stay together.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">Monthly</Badge>
              <Badge variant="info">{visibleBudgets.length} rows</Badge>
              <Button
                disabled={categoriesQuery.isLoading}
                onClick={openCreateBudget}
                variant="secondary"
              >
                Create budget
              </Button>
            </div>
          </div>

          {categoriesQuery.isError ? (
            <div className="mt-5 rounded-[22px] border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
              {resolveBudgetError(categoriesQuery.error, 'Unable to load categories right now.')}
            </div>
          ) : null}

          {budgetSummary.isError ? (
            <div className="mt-5 rounded-[22px] border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
              {resolveBudgetError(budgetSummary.error, 'Unable to load budgets right now.')}
            </div>
          ) : null}

          {pageMessage ? (
            <div
              className={cn(
                'mt-5 rounded-[22px] px-4 py-4 text-sm',
                pageMessage.toLowerCase().includes('unable')
                  ? 'border border-danger/20 bg-danger/10 text-danger'
                  : 'border border-brand/15 bg-brand/10 text-slate-700',
              )}
            >
              {pageMessage}
            </div>
          ) : null}

          {categoriesQuery.isLoading || budgetSummary.isLoading ? (
            <div className="mt-5 rounded-[24px] border border-line bg-white/80 px-5 py-8 text-center text-sm text-slate-500">
              Loading budgets for {monthLabel}...
            </div>
          ) : visibleBudgets.length > 0 ? (
            <div className="mt-5 space-y-2.5">
              {visibleBudgets.map((budget) => {
                const progress =
                  budget.limitAmount > 0 ? (budget.spent / budget.limitAmount) * 100 : 0;
                const toneClass =
                  budget.status === 'danger'
                    ? 'bg-danger/10 text-danger'
                    : budget.status === 'warning'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-brand/10 text-brand';

                return (
                  <article
                    key={budget.id}
                    className="rounded-[22px] border border-white/80 bg-white/88 px-3.5 py-3"
                  >
                    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(220px,0.95fr),minmax(280px,1.15fr)] lg:items-center lg:gap-3">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] text-sm font-semibold',
                            toneClass,
                          )}
                        >
                          {budget.categoryName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold text-ink">
                            {budget.categoryName}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <Badge
                              variant={
                                budget.status === 'danger'
                                  ? 'danger'
                                  : budget.status === 'warning'
                                    ? 'warning'
                                    : 'success'
                              }
                            >
                              {budget.status === 'danger'
                                ? 'Exceeded'
                                : budget.status === 'warning'
                                  ? 'Near limit'
                                  : 'On track'}
                            </Badge>
                            <p className="text-sm text-slate-500">{monthLabel} budget</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-3 lg:min-w-0">
                        <ProgressBar
                          helper={`${formatMoney(budget.spent)} of ${formatMoney(budget.limitAmount)}`}
                          size="sm"
                          status={budget.status}
                          value={progress}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-2.5 border-t border-line/70 pt-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="grid gap-2 sm:grid-cols-3 lg:flex lg:items-center lg:gap-2.5">
                        <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Left
                          </p>
                          <p className="mt-1 text-sm font-medium text-ink">
                            {budget.remaining >= 0
                              ? formatMoney(budget.remaining)
                              : `-${formatMoney(Math.abs(budget.remaining))}`}
                          </p>
                        </div>
                        <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Pace
                          </p>
                          <p className="mt-1 text-sm font-medium text-ink">
                            {budget.status === 'danger'
                              ? 'High'
                              : budget.status === 'warning'
                                ? 'Watch'
                                : 'Good'}
                          </p>
                        </div>
                        <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Limit
                          </p>
                          <p className="mt-1 text-sm font-medium text-ink">
                            {formatMoney(budget.limitAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                          onClick={() => openEditBudget(budget)}
                          type="button"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <PencilLine className="h-3.5 w-3.5" />
                            Edit
                          </span>
                        </button>
                        <button
                          className="rounded-full border border-danger/20 bg-white px-3 py-1.5 text-xs font-semibold text-danger transition hover:border-danger/40 hover:bg-danger/5"
                          disabled={deleteTargetId === budget.id}
                          onClick={() => handleDelete(budget.id)}
                          type="button"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <Trash2 className="h-3.5 w-3.5" />
                            {deleteTargetId === budget.id ? 'Deleting...' : 'Delete'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              action={
                <Button
                  disabled={categoriesQuery.isLoading}
                  onClick={openCreateBudget}
                  variant="soft"
                >
                  Create first budget
                </Button>
              }
              className="mt-5 rounded-[24px] px-5 py-6"
              description={
                searchValue || statusFilter !== 'all'
                  ? 'Try clearing the filters to see more budgets.'
                  : `No budgets set for ${monthLabel} yet.`
              }
              icon={Target}
              title={
                searchValue || statusFilter !== 'all'
                  ? 'No budgets match this view'
                  : 'No budgets yet'
              }
            />
          )}

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-warning/25 bg-warning/10 px-4 py-4">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 text-warning" />
                <div>
                  <p className="font-semibold text-ink">Near limit</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    {warningItems[0]
                      ? `${warningItems[0].categoryName} has ${formatMoney(Math.max(warningItems[0].remaining, 0))} left.`
                      : 'No categories are close to their limits right now.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-danger/20 bg-danger/10 px-4 py-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-danger" />
                <div>
                  <p className="font-semibold text-ink">Over budget</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    {overBudgetItems[0]
                      ? `${overBudgetItems[0].categoryName} is ${formatMoney(Math.abs(overBudgetItems[0].remaining))} over.`
                      : 'No categories are over budget right now.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>

      {isCreateBudgetOpen ? (
        <BudgetEditorModal
          categories={categories}
          fieldErrors={fieldErrors}
          formError={formError}
          formValues={formValues}
          isSubmitting={isSubmitting}
          monthLabel={monthLabel}
          onClose={closeBudgetModal}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
        />
      ) : null}
    </>
  );
}
