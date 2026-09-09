'use client';

import { createGoalSchema, formatShortDate, type Goal } from '@spendwise/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CircleX,
  Flag,
  PencilLine,
  PiggyBank,
  Plus,
  RotateCcw,
  Search,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { useConfirm } from '@/components/providers/confirm-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CircularGauge } from '@/components/ui/circular-gauge';
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
import { createGoal, deleteGoal, goalsQueryKey, listGoals, updateGoal } from '@/lib/goals/client';
import { cn } from '@/lib/utils';

type GoalFilter = 'all' | 'active' | 'completed' | 'failed';
type GoalEditorMode = 'create' | 'edit';
type GoalField = 'title' | 'targetAmount' | 'currentAmount' | 'targetDate' | 'notes';
type PageSize = 10 | 25 | 50 | 'all';

const compactSelectClassName =
  'h-9 rounded-[16px] border border-line bg-paper px-2.5 pr-7 text-xs font-medium text-ink shadow-xs outline-none transition focus:border-brand focus:bg-paper-strong cursor-pointer';

interface GoalFormValues {
  title: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  notes: string;
}

type GoalFieldErrors = Partial<Record<GoalField, string>>;

interface GoalView extends Goal {
  progress: number;
  remaining: number;
  monthsLeft: number;
  monthlyNeeded: number;
  status: 'active' | 'completed' | 'failed';
}

const goalPresets = [
  { title: 'Emergency fund', note: 'Three-month buffer' },
  { title: 'Vacation', note: 'Travel savings' },
  { title: 'Laptop upgrade', note: 'Work setup refresh' },
  { title: 'Debt payoff', note: 'Accelerated extra payments' },
] as const;

const getDefaultFormValues = (): GoalFormValues => ({
  title: '',
  targetAmount: '',
  currentAmount: '0',
  targetDate: new Date().toISOString().slice(0, 10),
  notes: '',
});

const parseAmountInput = (value: string) => Number(value.replace(/[^\d.]/g, ''));

const toDateInputValue = (value: string) => new Date(value).toISOString().slice(0, 10);

const toIsoDateValue = (value: string) => {
  if (!value) {
    return '';
  }

  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

const getMonthsLeft = (targetDate: string) => {
  const now = new Date();
  const target = new Date(targetDate);
  const yearDiff = target.getUTCFullYear() - now.getUTCFullYear();
  const monthDiff = target.getUTCMonth() - now.getUTCMonth();
  const totalMonths = yearDiff * 12 + monthDiff;

  return Math.max(1, totalMonths + (target.getUTCDate() >= now.getUTCDate() ? 1 : 0));
};

const resolveGoalError = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

function GoalEditorModal({
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
  fieldErrors: GoalFieldErrors;
  formError: string;
  formValues: GoalFormValues;
  isSubmitting: boolean;
  mode: GoalEditorMode;
  onClose: () => void;
  onFieldChange: (field: GoalField, value: string) => void;
  onPresetSelect: (title: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[rgba(19,38,63,0.42)] px-2.5 py-3 sm:px-4 sm:py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="panel-surface-strong max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-[24px] sm:rounded-[32px] px-4 py-4 sm:px-7 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="kicker">{mode === 'create' ? 'New goal' : 'Edit goal'}</p>
            <h2 className="mt-2 text-xl sm:text-2xl font-semibold text-ink">
              {mode === 'create' ? 'Create goal' : 'Update goal'}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-ink-soft">
              Save the target, current progress, and deadline so the workspace can track momentum.
            </p>
          </div>
          <button
            aria-label="Close goal editor"
            className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-[14px] sm:rounded-[18px] border border-line bg-paper-strong text-ink-soft transition hover:border-brand/30 hover:text-ink shrink-0"
            onClick={onClose}
            type="button"
          >
            <CircleX className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5 sm:gap-2">
          {goalPresets.map((preset) => (
            <button
              key={preset.title}
              className="rounded-full border border-line bg-paper-strong px-3 py-1.5 text-xs sm:text-sm font-semibold text-ink-soft transition hover:border-brand/30 hover:text-ink active:scale-95"
              onClick={() => onPresetSelect(preset.title)}
              type="button"
            >
              {preset.title}
            </button>
          ))}
        </div>

        <form className="mt-5 space-y-3.5 sm:space-y-4" onSubmit={onSubmit}>
          <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-medium text-ink">
            <span>Name</span>
            <Input
              className={cn(
                'text-base sm:text-sm',
                fieldErrors.title && 'border-danger focus:border-danger',
              )}
              onChange={(event) => onFieldChange('title', event.target.value)}
              placeholder="Emergency fund"
              value={formValues.title}
            />
            {fieldErrors.title ? <p className="text-xs text-danger">{fieldErrors.title}</p> : null}
          </label>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-medium text-ink">
              <span>Target</span>
              <Input
                className={cn(
                  'text-base sm:text-sm',
                  fieldErrors.targetAmount && 'border-danger focus:border-danger',
                )}
                inputMode="decimal"
                onChange={(event) => onFieldChange('targetAmount', event.target.value)}
                placeholder="3000"
                value={formValues.targetAmount}
              />
              {fieldErrors.targetAmount ? (
                <p className="text-xs text-danger">{fieldErrors.targetAmount}</p>
              ) : null}
            </label>
            <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-medium text-ink">
              <span>Deadline</span>
              <Input
                className={cn(
                  'text-base sm:text-sm',
                  fieldErrors.targetDate && 'border-danger focus:border-danger',
                )}
                onChange={(event) => onFieldChange('targetDate', event.target.value)}
                type="date"
                value={formValues.targetDate}
              />
              {fieldErrors.targetDate ? (
                <p className="text-xs text-danger">{fieldErrors.targetDate}</p>
              ) : null}
            </label>
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-medium text-ink">
              <span>Saved so far</span>
              <Input
                className={cn(
                  'text-base sm:text-sm',
                  fieldErrors.currentAmount && 'border-danger focus:border-danger',
                )}
                inputMode="decimal"
                onChange={(event) => onFieldChange('currentAmount', event.target.value)}
                placeholder="0"
                value={formValues.currentAmount}
              />
              {fieldErrors.currentAmount ? (
                <p className="text-xs text-danger">{fieldErrors.currentAmount}</p>
              ) : null}
            </label>
            <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-medium text-ink">
              <span>Short note</span>
              <Input
                className="text-base sm:text-sm"
                onChange={(event) => onFieldChange('notes', event.target.value)}
                placeholder="Weekly transfer"
                value={formValues.notes}
              />
            </label>
          </div>

          <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-medium text-ink">
            <span>Details</span>
            <Textarea
              className="min-h-[100px] text-base sm:text-sm"
              onChange={(event) => onFieldChange('notes', event.target.value)}
              placeholder="Why this goal matters or how you plan to fund it"
              value={formValues.notes}
            />
          </label>

          {formError ? (
            <div className="rounded-[20px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {formError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
            <Button
              className="w-full sm:w-auto h-11 sm:h-10 rounded-full text-sm"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
              variant="soft"
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto h-11 sm:h-10 rounded-full text-sm shadow-[0_12px_24px_rgba(15,123,113,0.2)]"
              disabled={isSubmitting}
              type="submit"
              variant="secondary"
            >
              {isSubmitting
                ? mode === 'create'
                  ? 'Saving...'
                  : 'Updating...'
                : mode === 'create'
                  ? 'Save goal'
                  : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FundGoalModal({
  amount,
  goalTitle,
  isSubmitting,
  onAmountChange,
  onClose,
  onSubmit,
}: {
  amount: string;
  goalTitle: string;
  isSubmitting: boolean;
  onAmountChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[rgba(19,38,63,0.42)] px-2.5 py-3 sm:px-4 sm:py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="panel-surface-strong max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-[24px] sm:rounded-[32px] px-4 py-4 sm:px-7 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="kicker">Fund goal</p>
            <h2 className="mt-2 text-xl sm:text-2xl font-semibold text-ink">{goalTitle}</h2>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-ink-soft">
              Add a contribution and the saved total will update immediately.
            </p>
          </div>
          <button
            aria-label="Close fund goal modal"
            className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-[14px] sm:rounded-[18px] border border-line bg-paper-strong text-ink-soft transition hover:border-brand/30 hover:text-ink shrink-0"
            onClick={onClose}
            type="button"
          >
            <CircleX className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        <form className="mt-5 space-y-3.5 sm:space-y-4" onSubmit={onSubmit}>
          <label className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-medium text-ink">
            <span>Contribution amount</span>
            <Input
              className="text-base sm:text-sm"
              inputMode="decimal"
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="100"
              value={amount}
            />
          </label>

          <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
            <Button
              className="w-full sm:w-auto h-11 sm:h-10 rounded-full text-sm"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
              variant="soft"
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto h-11 sm:h-10 rounded-full text-sm shadow-[0_12px_24px_rgba(15,123,113,0.2)]"
              disabled={isSubmitting}
              type="submit"
              variant="secondary"
            >
              {isSubmitting ? 'Adding...' : 'Add funds'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUserQuery();
  const { confirmDelete, confirmSave } = useConfirm();
  const formatMoney = (amount: number) => baseFormatMoney(amount, user?.currency ?? 'PHP');

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<GoalEditorMode>('create');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalFilter, setGoalFilter] = useState<GoalFilter>('all');
  const [searchValue, setSearchValue] = useState('');
  const [formValues, setFormValues] = useState<GoalFormValues>(getDefaultFormValues());
  const [fieldErrors, setFieldErrors] = useState<GoalFieldErrors>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageMessage, setPageMessage] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [fundingGoalId, setFundingGoalId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [goalPage, setGoalPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);

  const goalsQuery = useQuery({
    queryKey: goalsQueryKey,
    queryFn: listGoals,
  });

  const goalViews: GoalView[] = useMemo(() => {
    const goals = goalsQuery.data ?? [];
    const now = new Date();

    return goals.map((goal) => {
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      const monthsLeft = getMonthsLeft(goal.targetDate);
      const monthlyNeeded = remaining > 0 ? remaining / monthsLeft : 0;
      const isCompleted = goal.currentAmount >= goal.targetAmount;
      const targetDate = new Date(goal.targetDate);
      const isFailed = !isCompleted && targetDate.getTime() < now.getTime();
      const status: 'active' | 'completed' | 'failed' = isCompleted
        ? 'completed'
        : isFailed
          ? 'failed'
          : 'active';

      return {
        ...goal,
        progress,
        remaining,
        monthsLeft,
        monthlyNeeded,
        status,
      };
    });
  }, [goalsQuery.data]);

  const visibleGoals = useMemo(() => {
    return goalViews.filter((goal) => {
      const matchesSearch =
        !searchValue ||
        `${goal.title} ${goal.notes ?? ''}`.toLowerCase().includes(searchValue.toLowerCase());
      const matchesFilter = goalFilter === 'all' || goal.status === goalFilter;

      return matchesSearch && matchesFilter;
    });
  }, [goalViews, searchValue, goalFilter]);

  useEffect(() => {
    setGoalPage(1);
  }, [searchValue, goalFilter, pageSize]);

  const totalItems = visibleGoals.length;
  const isFiltered = searchValue.trim().length > 0 || goalFilter !== 'all';
  const statusCounts = useMemo(
    () => ({
      all: goalViews.length,
      active: goalViews.filter((goal) => goal.status === 'active').length,
      completed: goalViews.filter((goal) => goal.status === 'completed').length,
      failed: goalViews.filter((goal) => goal.status === 'failed').length,
    }),
    [goalViews],
  );

  const resetFilters = () => {
    setSearchValue('');
    setGoalFilter('all');
    setGoalPage(1);
  };

  const effectivePageSize = pageSize === 'all' ? totalItems || 1 : pageSize;
  const totalGoalPages = Math.ceil(totalItems / effectivePageSize) || 1;
  const currentGoalPage = Math.min(goalPage, totalGoalPages);
  const paginatedGoals =
    pageSize === 'all'
      ? visibleGoals
      : visibleGoals.slice(
          (currentGoalPage - 1) * effectivePageSize,
          currentGoalPage * effectivePageSize,
        );

  const totalSaved = visibleGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = visibleGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const leadingGoal =
    visibleGoals.reduce<GoalView | null>(
      (leader, goal) => (!leader || goal.progress > leader.progress ? goal : leader),
      null,
    ) ??
    goalViews.reduce<GoalView | null>(
      (leader, goal) => (!leader || goal.progress > leader.progress ? goal : leader),
      null,
    );

  const resetEditor = () => {
    setFormValues(getDefaultFormValues());
    setFieldErrors({});
    setFormError('');
    setEditingGoalId(null);
  };

  const openCreateEditor = () => {
    setEditorMode('create');
    resetEditor();
    setIsEditorOpen(true);
  };

  const openEditEditor = (goal: GoalView) => {
    setEditorMode('edit');
    setEditingGoalId(goal.id);
    setFieldErrors({});
    setFormError('');
    setFormValues({
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: toDateInputValue(goal.targetDate),
      notes: goal.notes ?? '',
    });
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    resetEditor();
  };

  const openFundModal = (goal: GoalView) => {
    setFundingGoalId(goal.id);
    setFundAmount('');
    setPageMessage('');
  };

  const closeFundModal = () => {
    setFundingGoalId(null);
    setFundAmount('');
  };

  const handleFieldChange = (field: GoalField, value: string) => {
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

  const handlePresetSelect = (title: string) => {
    const preset = goalPresets.find((item) => item.title === title);

    if (!preset) {
      return;
    }

    setFormValues((currentValues) => ({
      ...currentValues,
      title: preset.title,
      notes: preset.note,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      title: '',
    }));
    setFormError('');
  };

  const buildValidatedPayload = () => {
    const candidate = {
      title: formValues.title.trim(),
      targetAmount: parseAmountInput(formValues.targetAmount),
      currentAmount: parseAmountInput(formValues.currentAmount),
      targetDate: toIsoDateValue(formValues.targetDate),
      notes: formValues.notes.trim() || undefined,
    };
    const result = createGoalSchema.safeParse(candidate);

    if (!result.success) {
      const nextErrors: GoalFieldErrors = {};

      Object.entries(result.error.flatten().fieldErrors).forEach(([field, messages]) => {
        const firstMessage = messages?.[0];
        if (firstMessage) {
          nextErrors[field as GoalField] = firstMessage;
        }
      });

      setFieldErrors(nextErrors);
      setFormError('Please correct the highlighted fields before saving.');
      return null;
    }

    setFieldErrors({});
    return result.data;
  };

  const invalidateGoals = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['goals'] }),
      queryClient.invalidateQueries({ queryKey: dashboardAnalyticsQueryKey }),
    ]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = buildValidatedPayload();
    if (!payload) {
      return;
    }

    if (editorMode === 'edit') {
      const confirmed = await confirmSave({
        title: 'Save goal changes?',
        description: `Are you sure you want to save the updated target and deadline for "${payload.title}"?`,
        confirmText: 'Save changes',
      });

      if (!confirmed) {
        return;
      }
    }

    setIsSubmitting(true);
    setFormError('');
    setPageMessage('');

    try {
      if (editorMode === 'create') {
        await createGoal(payload);
        setPageMessage('Goal saved.');
      } else if (editingGoalId) {
        await updateGoal(editingGoalId, payload);
        setPageMessage('Goal updated.');
      }

      await invalidateGoals();
      closeEditor();
    } catch (error) {
      setFormError(resolveGoalError(error, 'Unable to save the goal right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFundGoal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const goal = goalViews.find((item) => item.id === fundingGoalId);
    const contribution = parseAmountInput(fundAmount);

    if (!goal || contribution <= 0) {
      setPageMessage('Enter a valid contribution amount before funding this goal.');
      return;
    }

    setIsSubmitting(true);
    setPageMessage('');

    try {
      await updateGoal(goal.id, {
        currentAmount: goal.currentAmount + contribution,
      });
      await invalidateGoals();
      closeFundModal();
      setPageMessage(`Added ${formatMoney(contribution)} to ${goal.title}.`);
    } catch (error) {
      setPageMessage(resolveGoalError(error, 'Unable to fund the goal right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    const targetGoal = goalViews.find((goal) => goal.id === goalId);
    const confirmed = await confirmDelete({
      title: 'Delete goal?',
      description: targetGoal
        ? `Are you sure you want to delete "${targetGoal.title}"? All tracking progress for this goal will be removed.`
        : 'Are you sure you want to delete this goal? This action cannot be undone.',
      confirmText: 'Delete goal',
    });

    if (!confirmed) {
      return;
    }

    setDeleteTargetId(goalId);
    setPageMessage('');

    try {
      await deleteGoal(goalId);
      await invalidateGoals();
      setPageMessage('Goal deleted.');
    } catch (error) {
      setPageMessage(resolveGoalError(error, 'Unable to delete the goal right now.'));
    } finally {
      setDeleteTargetId(null);
    }
  };

  const fundingGoal = fundingGoalId ? goalViews.find((goal) => goal.id === fundingGoalId) : null;

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          actions={
            <Button onClick={openCreateEditor} variant="secondary">
              <Plus className="h-4 w-4" />
              Create goal
            </Button>
          }
          description="Keep savings progress clear with live goals, funding, and deadline tracking."
          eyebrow="Goals"
          meta={
            <>
              <Badge variant="success">Progress first</Badge>
              <Badge variant="info">{visibleGoals.length} visible</Badge>
            </>
          }
          title="Tie spending to goals."
        />

        <section className="grid gap-4 xl:grid-cols-3">
          <MetricCard
            delta={`${goalViews.length} active`}
            helper="Tracked now"
            icon={Target}
            label="Goal library"
            value={goalViews.length.toString()}
          />
          <MetricCard
            delta="Saved"
            helper={`${visibleGoals.length} goals in view`}
            icon={PiggyBank}
            label="Total saved"
            tone="mint"
            value={formatMoney(totalSaved)}
          />
          <MetricCard
            delta="Top progress"
            helper={leadingGoal?.title ?? 'No goals yet'}
            icon={TrendingUp}
            label="Total target"
            value={formatMoney(totalTarget)}
          />
        </section>

        {/* Simplified & Streamlined Filter Card */}
        <SurfaceCard className="rounded-[30px] p-5 md:p-6">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr,auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  className="pl-10 pr-9"
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search goals by title or notes..."
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
              <Button onClick={openCreateEditor} variant="secondary">
                <Plus className="h-4 w-4" />
                Create goal
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { value: 'all' as const, label: 'All', count: statusCounts.all },
                  { value: 'active' as const, label: 'On track', count: statusCounts.active },
                  {
                    value: 'completed' as const,
                    label: 'Completed',
                    count: statusCounts.completed,
                  },
                  { value: 'failed' as const, label: 'Missed', count: statusCounts.failed },
                ].map(({ value, label, count }) => (
                  <button
                    key={value}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                      goalFilter === value
                        ? 'bg-brand text-white shadow-sm'
                        : 'border border-line bg-paper-strong text-ink-soft hover:border-brand/30 hover:text-ink',
                    )}
                    onClick={() => setGoalFilter(value)}
                    type="button"
                  >
                    <span>{label}</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                        goalFilter === value
                          ? 'bg-white/20 text-white'
                          : 'bg-black/5 text-ink-soft dark:bg-white/10',
                      )}
                    >
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              {isFiltered ? (
                <button
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft transition hover:text-brand"
                  onClick={resetFilters}
                  type="button"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset filters
                </button>
              ) : null}
            </div>
          </div>
        </SurfaceCard>

        {/* Full-width Goal List Card (aligned with Budget list design) */}
        <SurfaceCard className="rounded-[28px] p-4 md:p-5">
          <div className="flex flex-col gap-3 border-b border-line/70 pb-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="kicker">Goal list</p>
              <h2 className="mt-0.5 text-xl font-semibold leading-tight text-ink md:text-2xl">
                Review goals fast
              </h2>
              <p className="mt-0.5 text-xs text-ink-soft sm:text-sm">
                Status, momentum, and target deadlines.
              </p>
            </div>

            {/* Interactive Header Controls Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap sm:justify-end">
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

              {/* Create Goal Button */}
              <Button
                className="whitespace-nowrap"
                onClick={openCreateEditor}
                size="sm"
                variant="secondary"
              >
                <Plus className="h-4 w-4" />
                Create goal
              </Button>
            </div>
          </div>

          {goalsQuery.isError ? (
            <div className="mt-4 rounded-[20px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {resolveGoalError(goalsQuery.error, 'Unable to load goals right now.')}
            </div>
          ) : null}

          {pageMessage ? (
            <div
              className={cn(
                'mt-4 rounded-[20px] px-4 py-3 text-sm',
                pageMessage.toLowerCase().includes('unable') ||
                  pageMessage.toLowerCase().includes('valid')
                  ? 'border border-danger/20 bg-danger/10 text-danger'
                  : 'border border-brand/15 bg-brand/10 text-ink',
              )}
            >
              {pageMessage}
            </div>
          ) : null}

          {goalsQuery.isLoading ? (
            <div className="mt-4 space-y-2.5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[20px] border border-line bg-paper p-3.5 sm:p-4"
                >
                  <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3.5">
                      <Skeleton className="h-11 w-11 rounded-[16px]" />
                      <div>
                        <Skeleton className="h-4 w-32 rounded-full" />
                        <Skeleton className="mt-2 h-3 w-24 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-36 rounded-[16px]" />
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedGoals.length > 0 ? (
            <div className="mt-4 space-y-2.5">
              {paginatedGoals.map((goal) => {
                const toneClass =
                  goal.status === 'completed'
                    ? 'bg-emerald/10 text-emerald'
                    : goal.status === 'failed'
                      ? 'bg-danger/10 text-danger'
                      : 'bg-warning/15 text-warning';

                const statusBadgeVariant =
                  goal.status === 'completed'
                    ? 'success'
                    : goal.status === 'failed'
                      ? 'danger'
                      : 'warning';

                const gaugeStatus =
                  goal.status === 'completed'
                    ? 'safe'
                    : goal.status === 'failed'
                      ? 'danger'
                      : 'warning';

                return (
                  <article
                    key={goal.id}
                    className="rounded-[20px] border border-line bg-paper p-3.5 transition hover:border-brand/30 sm:p-4"
                  >
                    <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
                      {/* Left: Flag Icon, Title, Status Badge, and Timeline detail */}
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]',
                            toneClass,
                          )}
                        >
                          <Flag className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className="truncate text-[15px] font-semibold text-ink"
                              title={goal.title}
                            >
                              {goal.title}
                            </p>
                            <Badge variant={statusBadgeVariant}>
                              {goal.status === 'completed'
                                ? 'Completed'
                                : goal.status === 'failed'
                                  ? 'Missed'
                                  : 'On track'}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-ink-soft">
                            {goal.status === 'completed'
                              ? 'Goal reached!'
                              : goal.status === 'failed'
                                ? `Deadline passed on ${formatShortDate(goal.targetDate)} • ${formatMoney(goal.remaining)} short`
                                : `Target by ${formatShortDate(goal.targetDate)} • Save about ${formatMoney(goal.monthlyNeeded)}/mo`}
                            {goal.notes ? ` • ${goal.notes}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Right: Circular Gauge + Metric Pill + Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-3 sm:flex-nowrap sm:border-0 sm:pt-0 lg:justify-end lg:gap-4">
                        {/* Gauge + Spending Metric Pill */}
                        <div className="flex items-center gap-3 rounded-[16px] border border-line/70 bg-paper-strong/80 px-3 py-1.5 shadow-2xs">
                          <CircularGauge progress={goal.progress} size={42} status={gaugeStatus} />
                          <div className="min-w-0 text-left">
                            <p className="text-xs font-semibold text-ink">
                              {formatMoney(goal.currentAmount)}
                            </p>
                            <p className="text-[11px] font-medium text-ink-soft">
                              of {formatMoney(goal.targetAmount)} target
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            className="rounded-full border border-line bg-paper-strong px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-brand/30 hover:text-ink"
                            onClick={() => openFundModal(goal)}
                            type="button"
                          >
                            Fund
                          </button>
                          <button
                            className="rounded-full border border-line bg-paper-strong px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-brand/30 hover:text-ink"
                            onClick={() => openEditEditor(goal)}
                            type="button"
                          >
                            <span className="inline-flex items-center gap-1">
                              <PencilLine className="h-3 w-3" />
                              Edit
                            </span>
                          </button>
                          <button
                            className="rounded-full border border-danger/20 bg-paper-strong px-2.5 py-1 text-xs font-medium text-danger transition hover:border-danger/40 hover:bg-danger/5"
                            disabled={deleteTargetId === goal.id}
                            onClick={() => handleDelete(goal.id)}
                            type="button"
                          >
                            <span className="inline-flex items-center gap-1">
                              <Trash2 className="h-3 w-3" />
                              {deleteTargetId === goal.id ? 'Deleting...' : 'Delete'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              action={
                <Button onClick={openCreateEditor} variant="soft">
                  Create first goal
                </Button>
              }
              className="mt-4 rounded-[20px] px-4 py-5"
              description={
                searchValue || goalFilter !== 'all'
                  ? 'Try clearing the search or filter to see more goals.'
                  : 'Set your first savings goal to start tracking progress.'
              }
              icon={Target}
              title={
                searchValue || goalFilter !== 'all' ? 'No goals match this view' : 'No goals yet'
              }
            />
          )}

          {pageSize !== 'all' && totalItems > 0 ? (
            <div className="mt-3.5 border-t border-line/60 pt-3">
              <Pagination
                alwaysShow
                currentPage={currentGoalPage}
                onPageChange={setGoalPage}
                pageSize={pageSize}
                totalItems={totalItems}
                totalPages={totalGoalPages}
              />
            </div>
          ) : null}
        </SurfaceCard>
      </div>

      {isEditorOpen ? (
        <GoalEditorModal
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

      {fundingGoal ? (
        <FundGoalModal
          amount={fundAmount}
          goalTitle={fundingGoal.title}
          isSubmitting={isSubmitting}
          onAmountChange={setFundAmount}
          onClose={closeFundModal}
          onSubmit={handleFundGoal}
        />
      ) : null}
    </>
  );
}
