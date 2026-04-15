'use client';

import { createGoalSchema, formatShortDate, type Goal } from '@spendwise/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CircleX,
  Flag,
  PencilLine,
  PiggyBank,
  Sparkles,
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
import { Skeleton } from '@/components/ui/skeleton';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Textarea } from '@/components/ui/textarea';
import { formatMoney } from '@/lib/formatters';
import { createGoal, deleteGoal, goalsQueryKey, listGoals, updateGoal } from '@/lib/goals/client';
import { cn } from '@/lib/utils';

type GoalFilter = 'all' | 'active' | 'completed' | 'at-risk';
type GoalEditorMode = 'create' | 'edit';
type GoalField = 'title' | 'targetAmount' | 'currentAmount' | 'targetDate' | 'notes';

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
  status: 'active' | 'completed' | 'at-risk';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(19,38,63,0.42)] px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="panel-surface-strong max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] px-5 py-5 md:px-7 md:py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="kicker">{mode === 'create' ? 'New goal' : 'Edit goal'}</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">
              {mode === 'create' ? 'Create goal' : 'Update goal'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Save the target, current progress, and deadline so the workspace can track momentum.
            </p>
          </div>
          <button
            aria-label="Close goal editor"
            className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-line bg-white text-slate-500 transition hover:border-brand/30 hover:text-ink"
            onClick={onClose}
            type="button"
          >
            <CircleX className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {goalPresets.map((preset) => (
            <button
              key={preset.title}
              className="rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
              onClick={() => onPresetSelect(preset.title)}
              type="button"
            >
              {preset.title}
            </button>
          ))}
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Name</span>
            <Input
              className={cn(fieldErrors.title && 'border-danger focus:border-danger')}
              onChange={(event) => onFieldChange('title', event.target.value)}
              placeholder="Emergency fund"
              value={formValues.title}
            />
            {fieldErrors.title ? <p className="text-sm text-danger">{fieldErrors.title}</p> : null}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Target</span>
              <Input
                className={cn(fieldErrors.targetAmount && 'border-danger focus:border-danger')}
                onChange={(event) => onFieldChange('targetAmount', event.target.value)}
                placeholder="3000"
                value={formValues.targetAmount}
              />
              {fieldErrors.targetAmount ? (
                <p className="text-sm text-danger">{fieldErrors.targetAmount}</p>
              ) : null}
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Deadline</span>
              <Input
                className={cn(fieldErrors.targetDate && 'border-danger focus:border-danger')}
                onChange={(event) => onFieldChange('targetDate', event.target.value)}
                type="date"
                value={formValues.targetDate}
              />
              {fieldErrors.targetDate ? (
                <p className="text-sm text-danger">{fieldErrors.targetDate}</p>
              ) : null}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Saved so far</span>
              <Input
                className={cn(fieldErrors.currentAmount && 'border-danger focus:border-danger')}
                onChange={(event) => onFieldChange('currentAmount', event.target.value)}
                placeholder="0"
                value={formValues.currentAmount}
              />
              {fieldErrors.currentAmount ? (
                <p className="text-sm text-danger">{fieldErrors.currentAmount}</p>
              ) : null}
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Short note</span>
              <Input
                onChange={(event) => onFieldChange('notes', event.target.value)}
                placeholder="Weekly transfer"
                value={formValues.notes}
              />
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Details</span>
            <Textarea
              className="min-h-[110px]"
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

          <div className="flex flex-wrap gap-3">
            <Button disabled={isSubmitting} type="submit" variant="secondary">
              {isSubmitting
                ? mode === 'create'
                  ? 'Saving...'
                  : 'Updating...'
                : mode === 'create'
                  ? 'Save goal'
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(19,38,63,0.42)] px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="panel-surface-strong w-full max-w-lg rounded-[32px] px-5 py-5 md:px-7 md:py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="kicker">Fund goal</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">{goalTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add a contribution and the saved total will update immediately.
            </p>
          </div>
          <button
            aria-label="Close fund goal modal"
            className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-line bg-white text-slate-500 transition hover:border-brand/30 hover:text-ink"
            onClick={onClose}
            type="button"
          >
            <CircleX className="h-5 w-5" />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Contribution amount</span>
            <Input
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="100"
              value={amount}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <Button disabled={isSubmitting} type="submit" variant="secondary">
              {isSubmitting ? 'Adding...' : 'Add funds'}
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

export default function GoalsPage() {
  const queryClient = useQueryClient();
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

  const goalsQuery = useQuery({
    queryKey: goalsQueryKey,
    queryFn: listGoals,
  });

  const goalViews: GoalView[] = useMemo(() => {
    const goals = goalsQuery.data ?? [];

    return goals.map((goal) => {
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      const monthsLeft = getMonthsLeft(goal.targetDate);
      const monthlyNeeded = remaining > 0 ? remaining / monthsLeft : 0;
      const status =
        goal.currentAmount >= goal.targetAmount
          ? 'completed'
          : monthsLeft <= 2 && progress < 60
            ? 'at-risk'
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

  const visibleGoals = goalViews.filter((goal) => {
    const matchesSearch =
      !searchValue ||
      `${goal.title} ${goal.notes ?? ''}`.toLowerCase().includes(searchValue.toLowerCase());
    const matchesFilter = goalFilter === 'all' || goal.status === goalFilter;

    return matchesSearch && matchesFilter;
  });

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

  const suggestions = visibleGoals.slice(0, 3).map((goal) => {
    if (goal.status === 'completed') {
      return `${goal.title} is fully funded. Decide whether to close it or raise the target.`;
    }

    if (goal.monthlyNeeded <= 0) {
      return `${goal.title} is on track. Keep current transfers steady.`;
    }

    return `Set aside about ${formatMoney(goal.monthlyNeeded)} per month to finish ${goal.title} on time.`;
  });

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
    await queryClient.invalidateQueries({
      queryKey: ['goals'],
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
            <>
              <Button variant="soft">Savings ideas</Button>
              <Button onClick={openCreateEditor} variant="secondary">
                Create goal
              </Button>
            </>
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

        <SurfaceCard className="overflow-hidden rounded-[34px] px-5 py-5 md:px-6 md:py-6">
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),auto]">
              <Input
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search goals"
                value={searchValue}
              />
              <Button onClick={openCreateEditor} size="sm" variant="secondary">
                Create goal
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ['all', 'All'],
                ['active', 'Active'],
                ['completed', 'Completed'],
                ['at-risk', 'At risk'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    goalFilter === value
                      ? 'bg-brand text-white shadow-sm'
                      : 'border border-line bg-white text-slate-600 hover:border-brand/30 hover:text-ink',
                  )}
                  onClick={() => setGoalFilter(value as GoalFilter)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
              <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Top
                </p>
                <p className="mt-2 text-lg font-semibold leading-tight text-ink">
                  {leadingGoal?.title ?? 'No goals yet'}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Progress
                </p>
                <p className="mt-2 text-lg font-semibold leading-tight text-ink">
                  {totalTarget > 0
                    ? `${Math.round((totalSaved / totalTarget) * 100)}% funded`
                    : '0% funded'}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Next
                </p>
                <p className="mt-2 text-lg font-semibold leading-tight text-ink">
                  {suggestions[0] ? 'Review plan' : 'Create a goal'}
                </p>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
            <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="kicker">Goal progress</p>
                <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                  Review goals fast
                </h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                  Progress, deadline, and next step stay together.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral">Progress</Badge>
                <Badge variant="info">Rows</Badge>
                <Button onClick={openCreateEditor} variant="secondary">
                  Create goal
                </Button>
              </div>
            </div>

            {goalsQuery.isError ? (
              <div className="mt-5 rounded-[22px] border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
                {resolveGoalError(goalsQuery.error, 'Unable to load goals right now.')}
              </div>
            ) : null}

            {pageMessage ? (
              <div
                className={cn(
                  'mt-5 rounded-[22px] px-4 py-4 text-sm',
                  pageMessage.toLowerCase().includes('unable') ||
                    pageMessage.toLowerCase().includes('valid')
                    ? 'border border-danger/20 bg-danger/10 text-danger'
                    : 'border border-brand/15 bg-brand/10 text-slate-700',
                )}
              >
                {pageMessage}
              </div>
            ) : null}

            {goalsQuery.isLoading ? (
              <div className="mt-5 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-[22px] border border-white/80 bg-white/88 px-3.5 py-3"
                  >
                    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(240px,0.95fr),minmax(280px,1.15fr)] lg:items-center lg:gap-3">
                      <div className="flex items-center gap-3.5">
                        <Skeleton className="h-11 w-11 rounded-[16px]" />
                        <div className="min-w-0 flex-1">
                          <Skeleton className="h-4 w-36 rounded-full" />
                          <Skeleton className="mt-2 h-3 w-24 rounded-full" />
                        </div>
                      </div>
                      <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-3">
                        <Skeleton className="h-3 w-full rounded-full" />
                        <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleGoals.length > 0 ? (
              <div className="mt-5 space-y-2.5">
                {visibleGoals.map((goal) => (
                  <article
                    key={goal.id}
                    className="rounded-[22px] border border-white/80 bg-white/88 px-3.5 py-3"
                  >
                    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(240px,0.95fr),minmax(280px,1.15fr)] lg:items-center lg:gap-3">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-brand/10 text-brand">
                          <Flag className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[15px] font-semibold text-ink">{goal.title}</p>
                            <Badge
                              variant={
                                goal.status === 'completed'
                                  ? 'success'
                                  : goal.status === 'at-risk'
                                    ? 'warning'
                                    : 'info'
                              }
                            >
                              {goal.status === 'completed'
                                ? 'Completed'
                                : goal.status === 'at-risk'
                                  ? 'At risk'
                                  : 'Active'}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            Target by {formatShortDate(goal.targetDate)}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-3">
                        <ProgressBar
                          helper={`${formatMoney(goal.currentAmount)} of ${formatMoney(goal.targetAmount)}`}
                          size="sm"
                          status={goal.status === 'at-risk' ? 'warning' : 'safe'}
                          value={goal.progress}
                        />
                      </div>
                    </div>

                    <div className="mt-3 border-t border-line/70 pt-3">
                      <div className="grid gap-2.5 lg:grid-cols-[132px,minmax(0,1fr),auto] lg:items-start">
                        <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Done
                          </p>
                          <p className="mt-1 text-sm font-medium text-ink">
                            {Math.round(goal.progress)}%
                          </p>
                        </div>
                        <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Next step
                          </p>
                          <p className="mt-1 text-sm font-medium leading-6 text-ink">
                            {goal.status === 'completed'
                              ? 'Goal reached. Decide whether to archive it or set a stretch target.'
                              : `Save about ${formatMoney(goal.monthlyNeeded)} per month for the next ${goal.monthsLeft} month${goal.monthsLeft === 1 ? '' : 's'}.`}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button
                            className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                            onClick={() => openEditEditor(goal)}
                            type="button"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <PencilLine className="h-3.5 w-3.5" />
                              Edit
                            </span>
                          </button>
                          <button
                            className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                            onClick={() => openFundModal(goal)}
                            type="button"
                          >
                            Fund
                          </button>
                          <button
                            className="rounded-full border border-danger/20 bg-white px-3 py-1.5 text-xs font-semibold text-danger transition hover:border-danger/40 hover:bg-danger/5"
                            disabled={deleteTargetId === goal.id}
                            onClick={() => handleDelete(goal.id)}
                            type="button"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <Trash2 className="h-3.5 w-3.5" />
                              {deleteTargetId === goal.id ? 'Deleting...' : 'Delete'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                action={
                  <Button onClick={openCreateEditor} variant="soft">
                    Create first goal
                  </Button>
                }
                className="mt-5 rounded-[24px] px-5 py-6"
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
          </SurfaceCard>

          <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
            <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="kicker">Savings opportunities</p>
                <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                  Cutbacks tied to goals
                </h2>
              </div>
              <Sparkles className="h-5 w-5 text-brand" />
            </div>

            <div className="mt-5 space-y-2.5">
              {(suggestions.length > 0
                ? suggestions
                : ['Create a goal to get a simple monthly savings target and progress plan.']
              ).map((item) => (
                <article
                  key={item}
                  className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-3"
                >
                  <p className="font-semibold text-ink">{item}</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">Tie it to a goal.</p>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-[22px] border border-brand/15 bg-brand/5 px-4 py-4">
              <p className="font-semibold text-ink">Why it helps</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Each suggestion is based on what is left to save and how much time remains.
              </p>
            </div>
          </SurfaceCard>
        </section>
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
