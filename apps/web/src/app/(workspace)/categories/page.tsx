import { Car, Home, ReceiptText, Search, ShoppingBag, Utensils } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
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

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button variant="soft">View linked budgets</Button>
            <Button variant="secondary">Add category</Button>
          </>
        }
        description="Categories stay simple, recognizable, and consistent so dashboard summaries, analytics, and budget cards all read instantly."
        eyebrow="Categories"
        meta={
          <>
            <Badge variant="neutral">Default + custom categories</Badge>
            <Badge variant="info">Consistent icon and color mapping</Badge>
          </>
        }
        title="Organize spending into clear, meaningful groups."
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Category library</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">
            Visual tags that stay calm and scannable
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => {
              const Icon = iconMap[category.name as keyof typeof iconMap];

              return (
                <div
                  key={category.name}
                  className="rounded-[26px] border border-white/80 bg-white/80 px-5 py-5"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                  >
                    {Icon ? <Icon className="h-5 w-5" /> : null}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-ink">{category.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>
                  <p className="mt-4 text-sm font-medium text-slate-500">
                    {formatMoney(category.spend)} this month
                  </p>
                </div>
              );
            })}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
            <p className="kicker">Custom category</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">
              Add or edit a category without friction
            </h2>

            <div className="mt-6 space-y-4">
              <Input placeholder="Category name" />
              <Input placeholder="Optional short description" />
              <div className="flex flex-wrap gap-3">
                {['Mint', 'Navy', 'Sage', 'Coral', 'Stone'].map((token, index) => (
                  <button
                    key={token}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      index === 0
                        ? 'bg-brand text-white'
                        : 'border border-line bg-white text-slate-600'
                    }`}
                    type="button"
                  >
                    {token}
                  </button>
                ))}
              </div>
              <Button variant="secondary">Create category</Button>
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
            <p className="kicker">Management table</p>
            <div className="mt-4 space-y-3">
              {categories.slice(0, 4).map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between gap-4 rounded-[22px] border border-white/80 bg-white/80 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-ink">{category.name}</p>
                    <p className="text-sm text-slate-500">{category.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="soft">
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost">
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <EmptyState
            action={<Button variant="soft">Create first custom category</Button>}
            description="Empty states should explain the benefit of adding a custom category and reassure the user that defaults are already working."
            icon={Search}
            title="No custom categories yet"
          />
        </div>
      </section>
    </div>
  );
}
