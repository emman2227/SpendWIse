export type BudgetStatus = 'safe' | 'warning' | 'danger';

export interface SummaryMetric {
  label: string;
  value: number;
  delta: number;
  helper: string;
}

export interface TrendPoint {
  label: string;
  spend: number;
  budget: number;
  forecast: number;
}

export interface CategorySlice {
  name: string;
  amount: number;
  share: number;
  color: string;
}

export interface BudgetCardData {
  id: string;
  name: string;
  limit: number;
  spent: number;
  remaining: number;
  status: BudgetStatus;
  cadence: string;
}

export interface TransactionData {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  note: string;
  tags: string[];
  recurring?: boolean;
  alert?: boolean;
}

export interface InsightData {
  id: string;
  tone: 'info' | 'success' | 'warning';
  label: string;
  title: string;
  summary: string;
  why: string;
  evidence: string;
}

export interface AlertData {
  id: string;
  severity: 'warning' | 'danger' | 'info';
  merchant: string;
  category: string;
  amount: number;
  date: string;
  reason: string;
  suggestedAction: string;
}

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  nextCharge: string;
  frequency: string;
  paymentMethod: string;
  status: 'upcoming' | 'renewing' | 'paused';
}

export interface GoalData {
  id: string;
  title: string;
  target: number;
  saved: number;
  deadline: string;
  helper: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  category: 'Budget' | 'AI Insight' | 'Forecast' | 'Recurring' | 'Security';
  unread: boolean;
  time: string;
}

export const summaryMetrics: SummaryMetric[] = [
  {
    label: 'Total spent',
    value: 4380,
    delta: 6,
    helper: 'Compared with February',
  },
  {
    label: 'Remaining budget',
    value: 1420,
    delta: 12,
    helper: 'Still available this month',
  },
  {
    label: 'Monthly transactions',
    value: 34,
    delta: -9,
    helper: 'Lower than last month',
  },
  {
    label: 'Savings trend',
    value: 18,
    delta: 4,
    helper: 'Projected lift by month end',
  },
];

export const spendingTrend: TrendPoint[] = [
  { label: 'Nov', spend: 3840, budget: 5200, forecast: 4050 },
  { label: 'Dec', spend: 4280, budget: 5200, forecast: 4310 },
  { label: 'Jan', spend: 4590, budget: 5400, forecast: 4680 },
  { label: 'Feb', spend: 4140, budget: 5400, forecast: 4250 },
  { label: 'Mar', spend: 4380, budget: 5800, forecast: 4460 },
  { label: 'Apr', spend: 2170, budget: 5800, forecast: 4510 },
];

export const categoryShare: CategorySlice[] = [
  { name: 'Housing', amount: 1800, share: 41, color: '#13263F' },
  { name: 'Food', amount: 780, share: 18, color: '#0F7B71' },
  { name: 'Transport', amount: 420, share: 10, color: '#6DB7A9' },
  { name: 'Shopping', amount: 690, share: 16, color: '#A9CFC4' },
  { name: 'Bills', amount: 460, share: 11, color: '#D9EAE4' },
  { name: 'Other', amount: 230, share: 4, color: '#E9F1EF' },
];

export const budgets: BudgetCardData[] = [
  {
    id: 'budget-food',
    name: 'Food and dining',
    limit: 900,
    spent: 780,
    remaining: 120,
    status: 'warning',
    cadence: 'Monthly',
  },
  {
    id: 'budget-transport',
    name: 'Transport',
    limit: 520,
    spent: 412,
    remaining: 108,
    status: 'safe',
    cadence: 'Monthly',
  },
  {
    id: 'budget-shopping',
    name: 'Shopping',
    limit: 600,
    spent: 690,
    remaining: -90,
    status: 'danger',
    cadence: 'Monthly',
  },
  {
    id: 'budget-home',
    name: 'Home and utilities',
    limit: 2300,
    spent: 2140,
    remaining: 160,
    status: 'warning',
    cadence: 'Monthly',
  },
];

export const transactions: TransactionData[] = [
  {
    id: 'txn-1',
    merchant: 'Willow Market',
    category: 'Food',
    amount: 124.8,
    date: '2026-04-02T12:00:00.000Z',
    paymentMethod: 'Visa ending 1842',
    note: 'Weekly groceries',
    tags: ['Needs', 'Weekend'],
  },
  {
    id: 'txn-2',
    merchant: 'Metro Transit',
    category: 'Transport',
    amount: 18.5,
    date: '2026-04-02T08:30:00.000Z',
    paymentMethod: 'Apple Pay',
    note: 'Morning commute',
    tags: ['Daily'],
  },
  {
    id: 'txn-3',
    merchant: 'Nimbus Gym',
    category: 'Health',
    amount: 48,
    date: '2026-04-01T20:10:00.000Z',
    paymentMethod: 'Debit card',
    note: 'Monthly membership',
    tags: ['Recurring'],
    recurring: true,
  },
  {
    id: 'txn-4',
    merchant: 'Northshore Cafe',
    category: 'Food',
    amount: 26.9,
    date: '2026-04-01T13:20:00.000Z',
    paymentMethod: 'Visa ending 1842',
    note: 'Lunch meeting',
    tags: ['Work', 'Dining'],
  },
  {
    id: 'txn-5',
    merchant: 'Studio Ledger',
    category: 'Shopping',
    amount: 268,
    date: '2026-03-30T17:45:00.000Z',
    paymentMethod: 'Mastercard ending 9921',
    note: 'Desk accessories',
    tags: ['Home office'],
    alert: true,
  },
  {
    id: 'txn-6',
    merchant: 'Streamly',
    category: 'Entertainment',
    amount: 14.99,
    date: '2026-03-28T06:00:00.000Z',
    paymentMethod: 'Debit card',
    note: 'Subscription renewal',
    tags: ['Recurring', 'Subscription'],
    recurring: true,
  },
];

export const insights: InsightData[] = [
  {
    id: 'insight-1',
    tone: 'success',
    label: 'Habit trend',
    title: 'Dining spend is stabilizing after two higher months',
    summary:
      'Weekday dining is down 14%, which is helping your flexible categories stay closer to plan.',
    why: 'SpendWise compares weekday food charges against your trailing 90-day average.',
    evidence: '11 dining transactions this month versus 15 at the same point last month.',
  },
  {
    id: 'insight-2',
    tone: 'warning',
    label: 'Category growth',
    title: 'Shopping is pacing above target because of home-office purchases',
    summary:
      'Your shopping budget is already 15% over plan, driven by two larger setup-related transactions.',
    why: 'The model sees a cluster of shopping transactions that are both larger and more frequent than usual.',
    evidence: 'Average shopping transaction grew from $84 to $173 this month.',
  },
  {
    id: 'insight-3',
    tone: 'info',
    label: 'Recommendation',
    title: 'Move recurring subscriptions into a fixed-cost view',
    summary:
      'Grouping your monthly renewals together would make discretionary spending easier to judge at a glance.',
    why: 'Subscriptions currently appear across three categories, which makes baseline costs feel lower than they are.',
    evidence: 'You have 6 recurring payments totaling $219 every month.',
  },
];

export const alerts: AlertData[] = [
  {
    id: 'alert-1',
    severity: 'warning',
    merchant: 'Studio Ledger',
    category: 'Shopping',
    amount: 268,
    date: '2026-03-30T17:45:00.000Z',
    reason: 'This amount is 3.2x higher than your usual shopping transaction size.',
    suggestedAction:
      'Mark it as a one-time workspace purchase or review whether it belongs in another category.',
  },
  {
    id: 'alert-2',
    severity: 'info',
    merchant: 'Metro Transit',
    category: 'Transport',
    amount: 18.5,
    date: '2026-04-02T08:30:00.000Z',
    reason: 'Transport spend is trending 22% above your normal weekly pace.',
    suggestedAction: 'Check for fare changes or additional ride-share use this week.',
  },
  {
    id: 'alert-3',
    severity: 'danger',
    merchant: 'CloudHub',
    category: 'Bills',
    amount: 49.99,
    date: '2026-03-27T09:20:00.000Z',
    reason: 'A near-duplicate charge posted within 24 hours of your usual subscription date.',
    suggestedAction:
      'Confirm if this is expected. If not, contact the merchant or flag it as suspicious.',
  },
];

export const forecastTrend: TrendPoint[] = [
  { label: 'Week 1', spend: 1090, budget: 1450, forecast: 1110 },
  { label: 'Week 2', spend: 980, budget: 1450, forecast: 1060 },
  { label: 'Week 3', spend: 1240, budget: 1450, forecast: 1180 },
  { label: 'Week 4', spend: 1070, budget: 1450, forecast: 1160 },
];

export const forecastCategories = [
  {
    name: 'Food',
    projected: 820,
    confidence: 0.81,
    note: 'Likely to finish slightly above your current dining pace.',
  },
  {
    name: 'Transport',
    projected: 465,
    confidence: 0.74,
    note: 'Ride-share usage is trending higher than usual mid-month.',
  },
  {
    name: 'Bills',
    projected: 520,
    confidence: 0.92,
    note: 'Recurring renewals make this one of the most stable categories.',
  },
];

export const reportBars = [
  { label: 'Housing', current: 1800, previous: 1760 },
  { label: 'Food', current: 780, previous: 910 },
  { label: 'Transport', current: 420, previous: 340 },
  { label: 'Shopping', current: 690, previous: 430 },
  { label: 'Bills', current: 460, previous: 455 },
];

export const recurringPayments: RecurringPayment[] = [
  {
    id: 'rec-1',
    name: 'Rent',
    amount: 1800,
    nextCharge: '2026-04-05T09:00:00.000Z',
    frequency: 'Monthly',
    paymentMethod: 'Bank transfer',
    status: 'upcoming',
  },
  {
    id: 'rec-2',
    name: 'Nimbus Gym',
    amount: 48,
    nextCharge: '2026-04-08T07:00:00.000Z',
    frequency: 'Monthly',
    paymentMethod: 'Debit card',
    status: 'renewing',
  },
  {
    id: 'rec-3',
    name: 'Streamly',
    amount: 14.99,
    nextCharge: '2026-04-12T06:00:00.000Z',
    frequency: 'Monthly',
    paymentMethod: 'Debit card',
    status: 'renewing',
  },
  {
    id: 'rec-4',
    name: 'CloudHub',
    amount: 49.99,
    nextCharge: '2026-04-27T09:20:00.000Z',
    frequency: 'Monthly',
    paymentMethod: 'Credit card',
    status: 'paused',
  },
];

export const goals: GoalData[] = [
  {
    id: 'goal-1',
    title: 'Build a three-month emergency buffer',
    target: 9000,
    saved: 5800,
    deadline: 'August 2026',
    helper: 'At your current pace, you are 5 weeks ahead of plan.',
  },
  {
    id: 'goal-2',
    title: 'Trim dining spend by 12%',
    target: 1200,
    saved: 640,
    deadline: 'June 2026',
    helper: 'Cafes and takeout are the biggest opportunity areas.',
  },
];

export const notifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Shopping budget exceeded',
    detail: 'You crossed your shopping limit after the Studio Ledger purchase.',
    category: 'Budget',
    unread: true,
    time: '2h ago',
  },
  {
    id: 'notif-2',
    title: 'New AI insight ready',
    detail: 'SpendWise found a shift in your weekday dining habits.',
    category: 'AI Insight',
    unread: true,
    time: 'Today',
  },
  {
    id: 'notif-3',
    title: 'Rent due in 2 days',
    detail: 'Recurring payment reminder for your largest fixed monthly cost.',
    category: 'Recurring',
    unread: false,
    time: 'Yesterday',
  },
  {
    id: 'notif-4',
    title: 'Forecast risk elevated for transport',
    detail: 'Transport costs are pacing above your usual weekly average.',
    category: 'Forecast',
    unread: false,
    time: 'Yesterday',
  },
  {
    id: 'notif-5',
    title: 'New device sign-in detected',
    detail: 'A new browser session was used to access your account.',
    category: 'Security',
    unread: false,
    time: '3 days ago',
  },
];

export const categories = [
  {
    name: 'Housing',
    icon: 'Home',
    spend: 1800,
    color: '#13263F',
    description: 'Rent, utilities, and home upkeep',
  },
  {
    name: 'Food',
    icon: 'Utensils',
    spend: 780,
    color: '#0F7B71',
    description: 'Groceries, cafes, and dining out',
  },
  {
    name: 'Transport',
    icon: 'Car',
    spend: 420,
    color: '#6DB7A9',
    description: 'Transit, fuel, ride-share, and parking',
  },
  {
    name: 'Shopping',
    icon: 'ShoppingBag',
    spend: 690,
    color: '#A9CFC4',
    description: 'Personal purchases and lifestyle spend',
  },
  {
    name: 'Bills',
    icon: 'Receipt',
    spend: 460,
    color: '#DDE9E5',
    description: 'Utilities, software, and recurring services',
  },
];

export const faqItems = [
  {
    question: 'How does SpendWise explain AI insights?',
    answer:
      'Every insight includes a plain-language summary, a reason it appeared, and the evidence pattern used so the user can trust the suggestion without needing model jargon.',
  },
  {
    question: 'What counts as an anomaly?',
    answer:
      'We highlight transactions that are unusually large, duplicated, mistimed, or outside of your normal category behavior.',
  },
  {
    question: 'Can users export reports?',
    answer:
      'Yes. The reports area keeps export controls visible with CSV and PDF placeholders plus a print-friendly monthly summary.',
  },
];

export const onboardingBenefits = [
  'Track daily expenses with less friction',
  'Get AI summaries that explain behavior shifts',
  'Catch unusual charges before they become habits',
  'Forecast next-month pressure with confidence cues',
];

export const profileSnapshot = {
  name: 'Maya Tan',
  email: 'maya@spendwise.app',
  role: 'Personal plan',
  location: 'San Francisco, California',
  currency: 'USD',
};
