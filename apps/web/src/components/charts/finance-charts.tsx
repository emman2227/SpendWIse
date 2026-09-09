'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useCurrentUserQuery } from '@/lib/auth/client';
import type { CategorySlice, TrendPoint } from '@/lib/demo-data';
import { formatMoney as baseFormatMoney } from '@/lib/formatters';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChartTooltip = ({ active, label, payload }: any) => {
  const { data: user } = useCurrentUserQuery();
  const formatMoney = (amount: number) => baseFormatMoney(amount, user?.currency ?? 'PHP');

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="max-w-[260px] rounded-2xl border border-line bg-paper px-3.5 py-2.5 shadow-soft sm:max-w-xs">
      <p className="text-xs font-semibold text-ink sm:text-sm">{label}</p>
      <div className="mt-1.5 space-y-1.5">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((item: any) => (
          <div key={item.dataKey ?? item.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color ?? '#0F7B71' }}
              />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="text-xs font-semibold text-ink sm:text-sm">
              {formatMoney(item.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SpendingOverviewChart = ({ data }: { data: TrendPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ left: -15, right: 8, top: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0F7B71" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#0F7B71" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(92,113,132,0.1)" strokeDasharray="4 8" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="label"
          tick={{ fill: '#68778B', fontSize: 11 }}
          tickLine={false}
        />
        <YAxis axisLine={false} tick={false} tickLine={false} width={15} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#A7D7CC', strokeWidth: 1 }} />
        <Area
          dataKey="budget"
          fill="transparent"
          name="Budget"
          stroke="#13263F"
          strokeDasharray="6 8"
          strokeWidth={1.5}
          type="monotone"
        />
        <Area
          dataKey="spend"
          fill="url(#spendFill)"
          name="Spend"
          stroke="#0F7B71"
          strokeWidth={2.5}
          type="monotone"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const CategoryShareChart = ({ data }: { data: CategorySlice[] }) => {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          dataKey="amount"
          innerRadius={58}
          outerRadius={84}
          paddingAngle={4}
          stroke="transparent"
        >
          {data.map((item) => (
            <Cell key={item.name} fill={item.color} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const ForecastProjectionChart = ({
  data,
}: {
  data: { label: string; spend?: number; forecast?: number; range?: [number, number] }[];
}) => {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -15 }}>
        <defs>
          <linearGradient id="rangeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0F7B71" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#0F7B71" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(92,113,132,0.1)" strokeDasharray="4 8" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="label"
          tick={{ fill: '#68778B', fontSize: 11 }}
          tickLine={false}
        />
        <YAxis axisLine={false} tick={false} tickLine={false} width={15} />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          formatter={(value) => <span className="text-xs sm:text-sm text-ink-soft">{value}</span>}
        />
        <Area dataKey="range" fill="url(#rangeFill)" stroke="none" name="Forecast Range" />
        <Line
          dataKey="spend"
          dot={{ fill: '#13263F', r: 3 }}
          name="Observed"
          stroke="#13263F"
          strokeWidth={2.5}
          type="monotone"
        />
        <Line
          dataKey="forecast"
          dot={{ fill: '#0F7B71', r: 3 }}
          name="Forecast Path"
          stroke="#0F7B71"
          strokeDasharray="4 5"
          strokeWidth={2.5}
          type="monotone"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export const CategoryComparisonChart = ({
  data,
}: {
  data: Array<{ label: string; current: number; projected: number; budget?: number }>;
}) => {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={3} margin={{ left: -15, right: 8, top: 10, bottom: 0 }}>
        <CartesianGrid stroke="rgba(92,113,132,0.1)" strokeDasharray="4 8" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="label"
          tick={{ fill: '#68778B', fontSize: 11 }}
          tickLine={false}
        />
        <YAxis axisLine={false} tick={false} tickLine={false} width={15} />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          formatter={(value) => <span className="text-xs sm:text-sm text-ink-soft">{value}</span>}
        />
        <Bar dataKey="current" fill="#D7EAE4" name="Current spend" radius={[4, 4, 0, 0]} />
        <Bar dataKey="projected" fill="#0F7B71" name="Projected spend" radius={[4, 4, 0, 0]} />
        <Bar dataKey="budget" fill="#13263F" name="Budget limit" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
