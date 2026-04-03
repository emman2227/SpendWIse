'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { CategorySlice, TrendPoint } from '@/lib/demo-data';
import { formatMoney } from '@/lib/formatters';

interface TooltipPayloadItem {
  color?: string;
  dataKey?: string;
  name?: string;
  value?: number;
}

const ChartTooltip = ({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadItem[];
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-soft">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <div className="mt-2 space-y-2">
        {payload.map((item) => (
          <div key={item.dataKey ?? item.name} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color ?? '#0F7B71' }}
              />
              {item.name}
            </span>
            <span className="text-sm font-semibold text-ink">{formatMoney(item.value ?? 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SpendingOverviewChart = ({ data }: { data: TrendPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height={290}>
      <AreaChart data={data} margin={{ left: 0, right: 4, top: 10, bottom: 0 }}>
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
          tick={{ fill: '#68778B', fontSize: 12 }}
          tickLine={false}
        />
        <YAxis axisLine={false} tick={false} tickLine={false} width={20} />
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
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          dataKey="amount"
          innerRadius={68}
          outerRadius={92}
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

export const ForecastProjectionChart = ({ data }: { data: TrendPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="rgba(92,113,132,0.1)" strokeDasharray="4 8" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="label"
          tick={{ fill: '#68778B', fontSize: 12 }}
          tickLine={false}
        />
        <YAxis axisLine={false} tick={false} tickLine={false} width={20} />
        <Tooltip content={<ChartTooltip />} />
        <Legend formatter={(value) => <span className="text-sm text-slate-500">{value}</span>} />
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
          name="Forecast"
          stroke="#0F7B71"
          strokeDasharray="4 5"
          strokeWidth={2.5}
          type="monotone"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const CategoryComparisonChart = ({
  data,
}: {
  data: Array<{ label: string; current: number; previous: number }>;
}) => {
  return (
    <ResponsiveContainer width="100%" height={290}>
      <BarChart data={data} barGap={10}>
        <CartesianGrid stroke="rgba(92,113,132,0.1)" strokeDasharray="4 8" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="label"
          tick={{ fill: '#68778B', fontSize: 12 }}
          tickLine={false}
        />
        <YAxis axisLine={false} tick={false} tickLine={false} width={20} />
        <Tooltip content={<ChartTooltip />} />
        <Legend formatter={(value) => <span className="text-sm text-slate-500">{value}</span>} />
        <Bar dataKey="previous" fill="#D7EAE4" name="Previous period" radius={[10, 10, 0, 0]} />
        <Bar dataKey="current" fill="#0F7B71" name="Current period" radius={[10, 10, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
