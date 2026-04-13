'use client';

import {
  Car,
  CircleX,
  Home,
  Plus,
  ReceiptText,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  SwatchBook,
  Tag,
  Utensils,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { categories } from '@/lib/demo-data';
import { formatMoney } from '@/lib/formatters';

const iconMap = {
  Housing: Home,
  Food: Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Bills: ReceiptText,
};

const colorTokens = [
  { name: 'Mint', value: '#0F7B71' },
  { name: 'Navy', value: '#13263F' },
  { name: 'Sky', value: '#6DB7A9' },
  { name: 'Coral', value: '#C76D58' },
  { name: 'Stone', value: '#A9CFC4' },
];

export default function CategoriesPage() {
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  const totalCategorySpend = categories.reduce((sum, category) => sum + category.spend, 0);
  const highestSpendCategory = categories.reduce((top, category) =>
    category.spend > top.spend ? category : top,
  );

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          actions={
            <>
              <Button variant="soft">Linked budgets</Button>
              <Button onClick={() => setIsAddCategoryOpen(true)} variant="secondary">
                Add category
              </Button>
            </>
          }
          description="Keep categories clear and easy to scan."
          eyebrow="Categories"
          meta={
            <>
              <Badge variant="neutral">Default + custom</Badge>
              <Badge variant="info">Icons + colors</Badge>
            </>
          }
          title="Organize spending fast."
        />

        <section className="grid gap-4 xl:grid-cols-3">
          <MetricCard
            delta={`${categories.length} active`}
            helper="Available"
            icon={Tag}
            label="Category library"
            value={categories.length.toString()}
          />
          <MetricCard
            delta="Top"
            helper={highestSpendCategory.name}
            icon={SwatchBook}
            label="Tracked spend"
            tone="mint"
            value={formatMoney(totalCategorySpend)}
          />
          <MetricCard
            delta="Ready"
            helper="Defaults cover most use"
            icon={Plus}
            label="Custom categories"
            value="0"
          />
        </section>

        <SurfaceCard className="overflow-hidden rounded-[34px] px-5 py-5 md:px-6 md:py-6">
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input className="pl-11" placeholder="Search categories" />
              </div>
              <Button onClick={() => setIsAddCategoryOpen(true)} variant="secondary">
                <Plus className="h-4 w-4" />
                Add category
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {['All', 'Default', 'Custom', 'Linked', 'Review'].map((item, index) => (
                <button
                  key={item}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    index === 0
                      ? 'bg-brand text-white shadow-sm'
                      : 'border border-line bg-white text-slate-600 hover:border-brand/30 hover:text-ink'
                  }`}
                  type="button"
                >
                  {item}
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
                  <p className="mt-2 text-sm leading-6 text-slate-500">Name, icon, color, spend.</p>
                </div>
                <SwatchBook className="mt-1 h-5 w-5 shrink-0 text-brand" />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Top
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">{highestSpendCategory.name}</p>
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Layout
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">Compact rows</p>
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Add
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">In modal</p>
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
                Name, color, spend, actions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">Mapped</Badge>
              <Badge variant="info">Rows</Badge>
              <Button onClick={() => setIsAddCategoryOpen(true)} variant="secondary">
                Add category
              </Button>
              <Button variant="soft">
                <SlidersHorizontal className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            {categories.map((category) => {
              const Icon = iconMap[category.name as keyof typeof iconMap];

              return (
                <article
                  key={category.name}
                  className="rounded-[22px] border border-white/80 bg-white/88 px-3.5 py-3"
                >
                  <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(240px,1fr),minmax(220px,0.8fr),auto] lg:items-center lg:gap-3">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        {Icon ? <Icon className="h-5 w-5" /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[15px] font-semibold text-ink">{category.name}</p>
                          <Badge variant="neutral">Default</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{category.description}</p>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
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
                      <button
                        className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                        type="button"
                      >
                        Merge
                      </button>
                      <button
                        className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                        type="button"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-brand/15 bg-brand/5 px-4 py-4">
              <p className="font-semibold text-ink">Keep names calm and specific</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Prefer names like Food or Bills.
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200/80 bg-white/75 px-4 py-4">
              <p className="font-semibold text-ink">Color should help</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Keep color tied to each row.
              </p>
            </div>
          </div>

          <EmptyState
            action={<Button variant="soft">Create first custom category</Button>}
            className="mt-5 rounded-[24px] px-5 py-6"
            description="Defaults already work well."
            icon={Search}
            title="No custom categories yet"
          />
        </SurfaceCard>
      </div>

      {isAddCategoryOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(19,38,63,0.42)] px-4 py-6 backdrop-blur-sm"
          role="dialog"
        >
          <div className="panel-surface-strong max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] px-5 py-5 md:px-7 md:py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="kicker">Add category</p>
                <h2 className="mt-3 text-2xl font-semibold text-ink">Create category</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Create and return.</p>
              </div>
              <button
                aria-label="Close add category modal"
                className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-line bg-white text-slate-500 transition hover:border-brand/30 hover:text-ink"
                onClick={() => setIsAddCategoryOpen(false)}
                type="button"
              >
                <CircleX className="h-5 w-5" />
              </button>
            </div>

            <form className="mt-6 space-y-4">
              <label className="space-y-2 text-sm font-medium text-ink">
                <span>Name</span>
                <Input placeholder="Dining out" />
              </label>

              <label className="space-y-2 text-sm font-medium text-ink">
                <span>Note</span>
                <Input placeholder="Meals, cafes" />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-medium text-ink">Color</span>
                <div className="flex flex-wrap gap-3">
                  {colorTokens.map((token, index) => (
                    <button
                      key={token.name}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                        index === 0
                          ? 'bg-brand text-white'
                          : 'border border-line bg-white text-slate-600 hover:border-brand/30 hover:text-ink'
                      }`}
                      type="button"
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: token.value }}
                      />
                      {token.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary">
                  Save
                </Button>
                <Button onClick={() => setIsAddCategoryOpen(false)} type="button" variant="soft">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
