'use client';

import { type Category, createCategorySchema } from '@spendwise/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bolt,
  BookOpen,
  Car,
  CircleX,
  Film,
  HeartPulse,
  Home,
  PencilLine,
  PiggyBank,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  SwatchBook,
  Tag,
  Trash2,
  Utensils,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { SurfaceCard } from '@/components/ui/surface-card';
import {
  categoriesQueryKey,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '@/lib/categories/client';
import { formatMoney } from '@/lib/formatters';
import {
  listExpenses,
  transactionCategoriesQueryKey,
  transactionExpensesQueryKey,
} from '@/lib/transactions/client';
import { cn } from '@/lib/utils';

type CategoryScope = 'all' | 'default' | 'custom' | 'active' | 'unused';
type EditorMode = 'create' | 'edit';

interface CategoryFormValues {
  name: string;
  icon: string;
  color: string;
}

type CategoryField = keyof CategoryFormValues;
type CategoryFieldErrors = Partial<Record<CategoryField, string>>;

interface CategoryView extends Category {
  spend: number;
  transactionCount: number;
}

const iconOptions = [
  { value: 'home', label: 'Home', icon: Home },
  { value: 'utensils', label: 'Food', icon: Utensils },
  { value: 'car', label: 'Transport', icon: Car },
  { value: 'bolt', label: 'Utilities', icon: Bolt },
  { value: 'heart-pulse', label: 'Health', icon: HeartPulse },
  { value: 'sparkles', label: 'Personal care', icon: Sparkles },
  { value: 'book-open', label: 'Education', icon: BookOpen },
  { value: 'film', label: 'Entertainment', icon: Film },
  { value: 'shopping-bag', label: 'Shopping', icon: ShoppingBag },
  { value: 'piggy-bank', label: 'Savings', icon: PiggyBank },
  { value: 'wallet', label: 'Wallet', icon: Wallet },
] as const;

const iconMap = Object.fromEntries(
  iconOptions.map((option) => [option.value, option.icon]),
) as Record<string, (typeof iconOptions)[number]['icon']>;

const colorTokens = [
  { name: 'Mint', value: '#0F7B71' },
  { name: 'Navy', value: '#13263F' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Coral', value: '#C76D58' },
  { name: 'Gold', value: '#F59E0B' },
  { name: 'Rose', value: '#EF4444' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Slate', value: '#64748B' },
] as const;

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

const getDefaultFormValues = (): CategoryFormValues => ({
  name: '',
  icon: 'wallet',
  color: colorTokens[0].value,
});

const resolveCategoryError = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

function CategoryEditorModal({
  fieldErrors,
  formError,
  formValues,
  isSubmitting,
  mode,
  onClose,
  onFieldChange,
  onSubmit,
}: {
  fieldErrors: CategoryFieldErrors;
  formError: string;
  formValues: CategoryFormValues;
  isSubmitting: boolean;
  mode: EditorMode;
  onClose: () => void;
  onFieldChange: (field: CategoryField, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const PreviewIcon = iconMap[formValues.icon] ?? Wallet;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(19,38,63,0.42)] px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="panel-surface-strong max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] px-5 py-5 md:px-7 md:py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="kicker">{mode === 'create' ? 'Add category' : 'Edit category'}</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">
              {mode === 'create' ? 'Create category' : 'Update category'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Pick a clear name, icon, and color so the category is easy to scan everywhere.
            </p>
          </div>
          <button
            aria-label="Close category editor"
            className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-line bg-white text-slate-500 transition hover:border-brand/30 hover:text-ink"
            onClick={onClose}
            type="button"
          >
            <CircleX className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 rounded-[24px] border border-brand/10 bg-[linear-gradient(140deg,rgba(15,123,113,0.08),rgba(255,255,255,0.92))] px-5 py-5">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-[20px]"
              style={{ backgroundColor: `${formValues.color}20`, color: formValues.color }}
            >
              <PreviewIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                Preview
              </p>
              <p className="mt-1 text-lg font-semibold text-ink">
                {formValues.name.trim() || 'New category'}
              </p>
            </div>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={onSubmit}>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Name</span>
            <Input
              className={cn(fieldErrors.name && 'border-danger focus:border-danger')}
              onChange={(event) => onFieldChange('name', event.target.value)}
              placeholder="Dining out"
              value={formValues.name}
            />
            {fieldErrors.name ? <p className="text-sm text-danger">{fieldErrors.name}</p> : null}
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium text-ink">Icon</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {iconOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formValues.icon === option.value;

                return (
                  <button
                    key={option.value}
                    className={cn(
                      'flex items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition',
                      isSelected
                        ? 'border-brand bg-brand/10 text-ink'
                        : 'border-line bg-white text-slate-600 hover:border-brand/30 hover:text-ink',
                    )}
                    onClick={() => onFieldChange('icon', option.value)}
                    type="button"
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-[16px]"
                      style={{ backgroundColor: `${formValues.color}20`, color: formValues.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-semibold">{option.label}</span>
                  </button>
                );
              })}
            </div>
            {fieldErrors.icon ? <p className="text-sm text-danger">{fieldErrors.icon}</p> : null}
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-ink">Color</span>
            <div className="flex flex-wrap gap-3">
              {colorTokens.map((token) => {
                const isSelected = formValues.color === token.value;

                return (
                  <button
                    key={token.value}
                    className={cn(
                      'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                      isSelected
                        ? 'bg-brand text-white'
                        : 'border border-line bg-white text-slate-600 hover:border-brand/30 hover:text-ink',
                    )}
                    onClick={() => onFieldChange('color', token.value)}
                    type="button"
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: token.value }}
                    />
                    {token.name}
                  </button>
                );
              })}
            </div>
            {fieldErrors.color ? <p className="text-sm text-danger">{fieldErrors.color}</p> : null}
          </div>

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
                  ? 'Save category'
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

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState(getInitialMonthValue);
  const [scopeFilter, setScopeFilter] = useState<CategoryScope>('all');
  const [searchValue, setSearchValue] = useState('');
  const [formValues, setFormValues] = useState<CategoryFormValues>(getDefaultFormValues());
  const [fieldErrors, setFieldErrors] = useState<CategoryFieldErrors>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState('');

  const activeMonth = parseMonthValue(monthFilter);
  const categoriesQuery = useQuery({
    queryKey: categoriesQueryKey,
    queryFn: listCategories,
  });
  const expensesQuery = useQuery({
    queryKey: transactionExpensesQueryKey(activeMonth),
    queryFn: () => listExpenses(activeMonth),
  });

  const categories = categoriesQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];
  const spendByCategory = useMemo(() => {
    const totals = new Map<string, { spend: number; transactionCount: number }>();

    expenses.forEach((expense) => {
      const current = totals.get(expense.categoryId) ?? { spend: 0, transactionCount: 0 };

      totals.set(expense.categoryId, {
        spend: current.spend + expense.amount,
        transactionCount: current.transactionCount + 1,
      });
    });

    return totals;
  }, [expenses]);

  const categoryViews: CategoryView[] = categories.map((category) => {
    const totals = spendByCategory.get(category.id);

    return {
      ...category,
      spend: totals?.spend ?? 0,
      transactionCount: totals?.transactionCount ?? 0,
    };
  });

  const visibleCategories = categoryViews.filter((category) => {
    const matchesSearch =
      !searchValue ||
      `${category.name} ${category.icon} ${category.color}`
        .toLowerCase()
        .includes(searchValue.toLowerCase());

    const matchesScope =
      scopeFilter === 'all'
        ? true
        : scopeFilter === 'default'
          ? category.isSystemDefined
          : scopeFilter === 'custom'
            ? !category.isSystemDefined
            : scopeFilter === 'active'
              ? category.transactionCount > 0
              : category.transactionCount === 0;

    return matchesSearch && matchesScope;
  });

  const totalCategorySpend = visibleCategories.reduce((sum, category) => sum + category.spend, 0);
  const highestSpendCategory =
    visibleCategories.reduce<CategoryView | null>(
      (top, category) => (!top || category.spend > top.spend ? category : top),
      null,
    ) ??
    categoryViews.reduce<CategoryView | null>(
      (top, category) => (!top || category.spend > top.spend ? category : top),
      null,
    );
  const customCategoryCount = categoryViews.filter((category) => !category.isSystemDefined).length;
  const activeCategoryCount = categoryViews.filter(
    (category) => category.transactionCount > 0,
  ).length;

  const resetEditor = () => {
    setFieldErrors({});
    setFormError('');
    setFormValues(getDefaultFormValues());
    setEditingCategoryId(null);
  };

  const openCreateEditor = () => {
    setEditorMode('create');
    resetEditor();
    setIsEditorOpen(true);
  };

  const openEditEditor = (category: CategoryView) => {
    setEditorMode('edit');
    setEditingCategoryId(category.id);
    setFieldErrors({});
    setFormError('');
    setFormValues({
      name: category.name,
      icon: category.icon,
      color: category.color,
    });
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    resetEditor();
  };

  const handleFieldChange = (field: CategoryField, value: string) => {
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
      name: formValues.name.trim(),
      icon: formValues.icon,
      color: formValues.color,
    };
    const result = createCategorySchema.safeParse(candidate);

    if (!result.success) {
      const nextErrors: CategoryFieldErrors = {};

      Object.entries(result.error.flatten().fieldErrors).forEach(([field, messages]) => {
        const firstMessage = messages?.[0];

        if (firstMessage) {
          nextErrors[field as CategoryField] = firstMessage;
        }
      });

      setFieldErrors(nextErrors);
      setFormError('Please correct the highlighted fields before saving.');

      return null;
    }

    setFieldErrors({});
    return result.data;
  };

  const invalidateCategoryData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey }),
      queryClient.invalidateQueries({ queryKey: transactionCategoriesQueryKey }),
      queryClient.invalidateQueries({ queryKey: ['transactions', 'expenses'] }),
    ]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = buildValidatedPayload();

    if (!payload) {
      return;
    }

    setIsSubmitting(true);
    setPageMessage('');
    setFormError('');

    try {
      if (editorMode === 'create') {
        await createCategory(payload);
        setPageMessage('Category saved.');
      } else if (editingCategoryId) {
        await updateCategory(editingCategoryId, payload);
        setPageMessage('Category updated.');
      }

      await invalidateCategoryData();
      closeEditor();
    } catch (error) {
      setFormError(resolveCategoryError(error, 'Unable to save the category right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category: CategoryView) => {
    setDeleteTargetId(category.id);
    setPageMessage('');

    try {
      await deleteCategory(category.id);
      await invalidateCategoryData();
      setPageMessage(`Deleted ${category.name}.`);
    } catch (error) {
      setPageMessage(resolveCategoryError(error, 'Unable to delete the category right now.'));
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
              <Button asChild variant="soft">
                <Link href="/budgets">Linked budgets</Link>
              </Button>
              <Button onClick={openCreateEditor} variant="secondary">
                Add category
              </Button>
            </>
          }
          description="Manage your default and custom categories with live spend context."
          eyebrow="Categories"
          meta={
            <>
              <Badge variant="neutral">{categoryViews.length} total</Badge>
              <Badge variant="info">{formatMonthLabel(monthFilter)}</Badge>
            </>
          }
          title="Organize spending fast."
        />

        <section className="grid gap-4 xl:grid-cols-3">
          <MetricCard
            delta={`${visibleCategories.length} in view`}
            helper={`${activeCategoryCount} active this month`}
            icon={Tag}
            label="Category library"
            value={categoryViews.length.toString()}
          />
          <MetricCard
            delta={highestSpendCategory ? highestSpendCategory.name : 'No activity'}
            helper="Filtered monthly spend"
            icon={SwatchBook}
            label="Tracked spend"
            tone="mint"
            value={formatMoney(totalCategorySpend)}
          />
          <MetricCard
            delta={customCategoryCount ? 'Editable set' : 'Defaults only'}
            helper="User-created categories"
            icon={Plus}
            label="Custom categories"
            value={customCategoryCount.toString()}
          />
        </section>

        <SurfaceCard className="overflow-hidden rounded-[34px] px-5 py-5 md:px-6 md:py-6">
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),180px,auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-11"
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search categories"
                  value={searchValue}
                />
              </div>
              <Input
                onChange={(event) => setMonthFilter(event.target.value)}
                type="month"
                value={monthFilter}
              />
              <Button onClick={openCreateEditor} variant="secondary">
                <Plus className="h-4 w-4" />
                Add category
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ['all', 'All'],
                ['default', 'Default'],
                ['custom', 'Custom'],
                ['active', 'Active'],
                ['unused', 'Unused'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    scopeFilter === value
                      ? 'bg-brand text-white shadow-sm'
                      : 'border border-line bg-white text-slate-600 hover:border-brand/30 hover:text-ink',
                  )}
                  onClick={() => setScopeFilter(value as CategoryScope)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="rounded-[28px] border border-brand/10 bg-[linear-gradient(140deg,rgba(15,123,113,0.08),rgba(255,255,255,0.92))] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <p className="kicker">Category snapshot</p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">
                    Recognition should be instant.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Names, icons, colors, and monthly activity all stay in the same row.
                  </p>
                </div>
                <SwatchBook className="mt-1 h-5 w-5 shrink-0 text-brand" />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Top
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    {highestSpendCategory?.name ?? 'No spend yet'}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Active
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    {activeCategoryCount} categories
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Add
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">Live modal</p>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Category list</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Review categories fast
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                Each row shows type, color, spend, and whether it is safe to edit.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">{formatMonthLabel(monthFilter)}</Badge>
              <Badge variant="info">{scopeFilter}</Badge>
              <Button onClick={openCreateEditor} variant="secondary">
                Add category
              </Button>
            </div>
          </div>

          {categoriesQuery.isError ? (
            <div className="mt-5 rounded-[22px] border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
              {resolveCategoryError(categoriesQuery.error, 'Unable to load categories right now.')}
            </div>
          ) : null}

          {expensesQuery.isError ? (
            <div className="mt-5 rounded-[22px] border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
              {resolveCategoryError(
                expensesQuery.error,
                'Unable to load category activity right now.',
              )}
            </div>
          ) : null}

          {pageMessage ? (
            <div
              className={cn(
                'mt-5 rounded-[22px] px-4 py-4 text-sm',
                pageMessage.toLowerCase().includes('unable') ||
                  pageMessage.toLowerCase().includes('linked') ||
                  pageMessage.toLowerCase().includes('cannot')
                  ? 'border border-danger/20 bg-danger/10 text-danger'
                  : 'border border-brand/15 bg-brand/10 text-slate-700',
              )}
            >
              {pageMessage}
            </div>
          ) : null}

          {categoriesQuery.isLoading || expensesQuery.isLoading ? (
            <div className="mt-5 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[22px] border border-white/80 bg-white/88 px-3.5 py-3"
                >
                  <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(260px,1fr),minmax(260px,0.9fr),auto] lg:items-center lg:gap-3">
                    <div className="flex items-center gap-3.5">
                      <Skeleton className="h-11 w-11 rounded-[16px]" />
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-4 w-28 rounded-full" />
                        <Skeleton className="mt-2 h-3 w-52 max-w-full rounded-full" />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, statIndex) => (
                        <div
                          key={statIndex}
                          className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2"
                        >
                          <Skeleton className="h-3 w-14 rounded-full" />
                          <Skeleton className="mt-2 h-4 w-16 rounded-full" />
                        </div>
                      ))}
                    </div>
                    <Skeleton className="h-10 w-full rounded-[18px] lg:w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleCategories.length > 0 ? (
            <div className="mt-5 space-y-2.5">
              {visibleCategories.map((category) => {
                const Icon = iconMap[category.icon] ?? Wallet;
                const canManage = !category.isSystemDefined;

                return (
                  <article
                    key={category.id}
                    className="rounded-[22px] border border-white/80 bg-white/88 px-3.5 py-3"
                  >
                    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(260px,1fr),minmax(260px,0.9fr),auto] lg:items-center lg:gap-3">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[15px] font-semibold text-ink">{category.name}</p>
                            <Badge variant={category.isSystemDefined ? 'neutral' : 'info'}>
                              {category.isSystemDefined ? 'Default' : 'Custom'}
                            </Badge>
                            {category.transactionCount > 0 ? (
                              <Badge variant="success">Active</Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            {category.isSystemDefined
                              ? 'System category available across the workspace.'
                              : 'Custom category you can rename or remove if nothing is linked.'}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Spend
                          </p>
                          <p className="mt-1 text-sm font-medium text-ink">
                            {formatMoney(category.spend)}
                          </p>
                        </div>
                        <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Txns
                          </p>
                          <p className="mt-1 text-sm font-medium text-ink">
                            {category.transactionCount}
                          </p>
                        </div>
                        <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Color
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <p className="text-sm font-medium text-ink">{category.color}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {canManage ? (
                          <>
                            <button
                              className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                              onClick={() => openEditEditor(category)}
                              type="button"
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <PencilLine className="h-3.5 w-3.5" />
                                Edit
                              </span>
                            </button>
                            <button
                              className="rounded-full border border-danger/20 bg-white px-3 py-1.5 text-xs font-semibold text-danger transition hover:border-danger/40 hover:bg-danger/5"
                              disabled={deleteTargetId === category.id}
                              onClick={() => handleDelete(category)}
                              type="button"
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <Trash2 className="h-3.5 w-3.5" />
                                {deleteTargetId === category.id ? 'Deleting...' : 'Delete'}
                              </span>
                            </button>
                          </>
                        ) : (
                          <Badge variant="neutral">Protected</Badge>
                        )}
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
                  Create custom category
                </Button>
              }
              className="mt-5 rounded-[24px] px-5 py-6"
              description={
                searchValue || scopeFilter !== 'all'
                  ? 'Try clearing the search or switching back to a broader filter.'
                  : 'No categories are available yet.'
              }
              icon={Search}
              title={
                searchValue || scopeFilter !== 'all'
                  ? 'No categories match this view'
                  : 'No categories yet'
              }
            />
          )}

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-brand/15 bg-brand/5 px-4 py-4">
              <p className="font-semibold text-ink">Defaults stay protected</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                System categories cannot be renamed or deleted, which keeps shared reporting stable.
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200/80 bg-white/75 px-4 py-4">
              <p className="font-semibold text-ink">Delete only when clean</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Custom categories must be unlinked from expenses and budgets before removal.
              </p>
            </div>
          </div>
        </SurfaceCard>
      </div>

      {isEditorOpen ? (
        <CategoryEditorModal
          fieldErrors={fieldErrors}
          formError={formError}
          formValues={formValues}
          isSubmitting={isSubmitting}
          mode={editorMode}
          onClose={closeEditor}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
        />
      ) : null}
    </>
  );
}
