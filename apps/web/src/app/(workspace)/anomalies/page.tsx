'use client';

import {
  type Alert,
  type AlertSeverity,
  type AlertStatus,
  formatShortDate,
} from '@spendwise/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Flame,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SurfaceCard } from '@/components/ui/surface-card';
import {
  alertsQueryKey,
  dismissAllAlerts,
  generateAlerts,
  getAlerts,
  updateAlertStatus,
} from '@/lib/analytics/client';
import { useCurrentUserQuery } from '@/lib/auth/client';
import { formatMoney as baseFormatMoney } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type FilterStatus = 'all' | AlertStatus;

const PAGE_SIZE = 5;

export default function AnomaliesPage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUserQuery();
  const formatMoney = (amount: number) => baseFormatMoney(amount, user?.currency ?? 'PHP');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery]);

  // Queries
  const {
    data: alertsData = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: alertsQueryKey,
    queryFn: () => getAlerts(),
  });

  // Mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AlertStatus }) =>
      updateAlertStatus(id, status),
    onSuccess: (updatedAlert) => {
      queryClient.setQueryData<Alert[]>(alertsQueryKey, (old = []) =>
        old.map((item) => (item.id === updatedAlert.id ? updatedAlert : item)),
      );
      const actionLabels: Record<AlertStatus, string> = {
        normal: 'marked as normal spending',
        important: 'flagged as important for review',
        dismissed: 'dismissed',
        pending: 'reset to pending',
      };
      setActionMessage(
        `Alert "${updatedAlert.merchant}" was ${actionLabels[updatedAlert.status]}.`,
      );
    },
  });

  const dismissAllMutation = useMutation({
    mutationFn: dismissAllAlerts,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: alertsQueryKey });
      setActionMessage(`${data.dismissedCount} alert(s) marked as dismissed.`);
    },
  });

  const rescanMutation = useMutation({
    mutationFn: () => generateAlerts(),
    onSuccess: (newAlerts) => {
      queryClient.setQueryData(alertsQueryKey, newAlerts);
      setActionMessage(`Scanned transactions: ${newAlerts.length} total alerts detected.`);
    },
  });

  // Metrics
  const metrics = useMemo(() => {
    const total = alertsData.length;
    const pending = alertsData.filter((a) => a.status === 'pending').length;
    const danger = alertsData.filter((a) => a.severity === 'danger').length;
    const resolved = alertsData.filter(
      (a) => a.status === 'normal' || a.status === 'important',
    ).length;
    return { total, pending, danger, resolved };
  }, [alertsData]);

  // Filtered list
  const filteredAlerts = useMemo(() => {
    return alertsData.filter((alert) => {
      const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        alert.merchant.toLowerCase().includes(query) ||
        alert.category.toLowerCase().includes(query) ||
        alert.reason.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [alertsData, filterStatus, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedAlerts = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return filteredAlerts.slice(start, start + PAGE_SIZE);
  }, [filteredAlerts, validCurrentPage]);

  // Selected Alert
  const selectedAlert = useMemo(() => {
    if (selectedId) {
      const found = alertsData.find((a) => a.id === selectedId);
      if (found) return found;
    }
    return filteredAlerts[0] ?? null;
  }, [alertsData, filteredAlerts, selectedId]);

  const getSeverityBadgeVariant = (severity: AlertSeverity): 'danger' | 'warning' | 'info' => {
    if (severity === 'danger') return 'danger';
    if (severity === 'warning') return 'warning';
    return 'info';
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'normal':
        return <Badge variant="neutral">Normal / Verified</Badge>;
      case 'important':
        return <Badge variant="warning">Important</Badge>;
      case 'dismissed':
        return <Badge variant="neutral">Dismissed</Badge>;
      default:
        return <Badge variant="info">Pending Review</Badge>;
    }
  };

  const getTypeIcon = (type: Alert['type']) => {
    switch (type) {
      case 'duplicate':
        return <Copy className="h-4 w-4" />;
      case 'budget_risk':
        return <TrendingUp className="h-4 w-4" />;
      case 'spike':
        return <Flame className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button
              disabled={rescanMutation.isPending || isRefetching}
              onClick={() => rescanMutation.mutate()}
              variant="soft"
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  (rescanMutation.isPending || isRefetching) && 'animate-spin',
                )}
              />
              {rescanMutation.isPending ? 'Scanning...' : 'Re-scan spend'}
            </Button>
            <Button
              disabled={metrics.pending === 0 || dismissAllMutation.isPending}
              onClick={() => dismissAllMutation.mutate()}
              variant="secondary"
            >
              Dismiss all pending
            </Button>
          </>
        }
        description="Continuous monitoring for unusual spending spikes, recurring duplicate leaks, and budget overruns."
        eyebrow="Anomaly Radar & Alerts"
        meta={
          <>
            <Badge variant={metrics.pending > 0 ? 'warning' : 'neutral'}>
              {metrics.pending} pending review
            </Badge>
            <Badge variant={metrics.danger > 0 ? 'danger' : 'neutral'}>
              {metrics.danger} high severity
            </Badge>
          </>
        }
        title="Transactions and patterns that deserve a second look."
      />

      {actionMessage ? (
        <div className="flex items-center justify-between rounded-[22px] border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-ink animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-brand" />
            <span>{actionMessage}</span>
          </div>
          <button
            className="text-xs font-semibold text-ink-soft hover:text-ink"
            onClick={() => setActionMessage(null)}
            type="button"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* KPI Overview */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Total Flagged',
            value: metrics.total.toString(),
            helper: 'Detected anomalies',
            icon: ShieldAlert,
            variant: 'text-brand',
          },
          {
            label: 'High Severity',
            value: metrics.danger.toString(),
            helper: 'Duplicates or heavy spikes',
            icon: Flame,
            variant: 'text-danger',
          },
          {
            label: 'Pending Triage',
            value: metrics.pending.toString(),
            helper: 'Awaiting your review',
            icon: AlertTriangle,
            variant: 'text-warning',
          },
          {
            label: 'Resolved / Normal',
            value: metrics.resolved.toString(),
            helper: 'Marked safe or audited',
            icon: ShieldCheck,
            variant: 'text-forest',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <SurfaceCard key={item.label} className="rounded-[28px] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink-soft">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-ink">{item.value}</p>
                  <p className="mt-1.5 text-xs text-ink-soft">{item.helper}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-paper-strong">
                  <Icon className={cn('h-5 w-5', item.variant)} />
                </div>
              </div>
            </SurfaceCard>
          );
        })}
      </section>

      {/* Vertical Stack: 1. Alert Detail & Triage Card (Above) */}
      <SurfaceCard className="rounded-[28px] px-5 py-6 sm:rounded-[32px] sm:px-7 sm:py-7">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-4">
          <div>
            <p className="kicker">Alert detail & triage</p>
            <h2 className="mt-1 text-xl font-semibold text-ink sm:text-2xl">
              {selectedAlert ? selectedAlert.merchant : 'No alert selected'}
            </h2>
          </div>
          {selectedAlert ? (
            <div className="flex items-center gap-2">
              {getStatusBadge(selectedAlert.status)}
              <Badge variant={getSeverityBadgeVariant(selectedAlert.severity)}>
                {selectedAlert.severity}
              </Badge>
            </div>
          ) : null}
        </div>

        {selectedAlert ? (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-soft">
              <p>
                Category: <span className="font-semibold text-ink">{selectedAlert.category}</span>
              </p>
              <p>
                Flagged Amount:{' '}
                <span className="font-semibold text-ink">{formatMoney(selectedAlert.amount)}</span>
              </p>
              <p>
                Date:{' '}
                <span className="font-semibold text-ink">
                  {selectedAlert.date ? formatShortDate(selectedAlert.date) : 'Recent'}
                </span>
              </p>
              <p>
                Type:{' '}
                <span className="font-semibold capitalize text-ink">
                  {selectedAlert.type.replace('_', ' ')}
                </span>
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-warning/25 bg-warning/10 p-5">
                <div className="flex items-center gap-2 text-ink">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <p className="text-sm font-semibold">Reason for Flagging</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft sm:text-sm">
                  {selectedAlert.reason}
                </p>
                {selectedAlert.evidence && Object.keys(selectedAlert.evidence).length > 0 ? (
                  <div className="mt-3 rounded-xl border border-warning/20 bg-paper/60 p-2.5 text-xs text-ink-soft">
                    <span className="font-medium text-ink">Evidence:</span>{' '}
                    {Object.entries(selectedAlert.evidence)
                      .filter(([k]) => !k.includes('Id'))
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(' • ')}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[22px] border border-line bg-paper p-5">
                <div className="flex items-center gap-2 text-ink">
                  <Sparkles className="h-4 w-4 text-brand" />
                  <p className="text-sm font-semibold">Suggested Action</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft sm:text-sm">
                  {selectedAlert.suggestedAction}
                </p>
              </div>

              <div className="rounded-[22px] border border-line bg-sage/30 p-5">
                <div className="flex items-center gap-2 text-ink">
                  <ShieldCheck className="h-4 w-4 text-forest" />
                  <p className="text-sm font-semibold">Triage Guidance</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft sm:text-sm">
                  Classifying this alert updates SpendWise’s spending baseline and suppresses
                  recurring false alerts for regular vendor charges.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 border-t border-line/60 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 [&>button]:w-full sm:[&>button]:w-auto [&>a]:w-full sm:[&>a]:w-auto">
              <Button
                disabled={statusMutation.isPending || selectedAlert.status === 'important'}
                onClick={() => statusMutation.mutate({ id: selectedAlert.id, status: 'important' })}
                variant={selectedAlert.status === 'important' ? 'soft' : 'secondary'}
              >
                {selectedAlert.status === 'important' ? 'Marked Important' : 'Mark as important'}
              </Button>

              <Button
                disabled={statusMutation.isPending || selectedAlert.status === 'normal'}
                onClick={() => statusMutation.mutate({ id: selectedAlert.id, status: 'normal' })}
                variant={selectedAlert.status === 'normal' ? 'secondary' : 'soft'}
              >
                {selectedAlert.status === 'normal' ? 'Marked as Normal' : 'This is normal'}
              </Button>

              <Button
                disabled={statusMutation.isPending || selectedAlert.status === 'dismissed'}
                onClick={() => statusMutation.mutate({ id: selectedAlert.id, status: 'dismissed' })}
                variant="ghost"
              >
                Dismiss alert
              </Button>

              <Button asChild size="sm" variant="ghost">
                <Link href="/transactions" className="flex items-center justify-center gap-1.5">
                  <span>View in Transactions</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-44 flex-col items-center justify-center rounded-[20px] border border-dashed border-line bg-paper/40 p-6 text-center text-xs text-ink-soft sm:rounded-[24px] sm:text-sm">
            <ShieldAlert className="h-8 w-8 text-ink-soft/40" />
            <p className="mt-2 font-medium text-ink">No alert selected</p>
            <p className="mt-1">Select an alert from the list below to inspect and triage.</p>
          </div>
        )}
      </SurfaceCard>

      {/* Vertical Stack: 2. Filter Bar & Alerts List (Below) */}
      <SurfaceCard className="rounded-[28px] px-5 py-6 sm:rounded-[32px] sm:px-7 sm:py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="kicker">Alerts list</p>
            <h2 className="mt-1 text-xl font-semibold text-ink sm:text-2xl">
              Flagged activity backlog
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { key: 'pending', label: `Pending (${metrics.pending})` },
                  { key: 'all', label: `All (${metrics.total})` },
                  { key: 'important', label: 'Important' },
                  { key: 'normal', label: 'Normal' },
                  { key: 'dismissed', label: 'Dismissed' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-3.5 sm:text-sm',
                    filterStatus === tab.key
                      ? 'bg-brand text-white shadow-sm'
                      : 'border border-line bg-paper text-ink-soft hover:border-brand/30 hover:text-ink',
                  )}
                  onClick={() => setFilterStatus(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
              <input
                className="w-full rounded-2xl border border-line bg-paper py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-ink-soft/70 focus:border-brand focus:outline-none sm:text-sm"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts..."
                type="text"
                value={searchQuery}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-[20px] border border-line bg-paper/60"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="mt-6 rounded-[20px] border border-danger/20 bg-danger/10 p-6 text-center text-sm text-danger">
            Failed to load alerts. Please check your connection and try refreshing.
            <Button className="mt-3" onClick={() => void refetch()} size="sm" variant="soft">
              Try Again
            </Button>
          </div>
        ) : paginatedAlerts.length > 0 ? (
          <div className="mt-6 space-y-3">
            {paginatedAlerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'cursor-pointer rounded-[22px] border p-4 transition duration-150 sm:p-5',
                    isSelected
                      ? 'border-brand bg-brand/[0.04] shadow-sm ring-1 ring-brand/30'
                      : 'border-line bg-paper hover:border-brand/30 hover:bg-paper-strong',
                  )}
                  onClick={() => setSelectedId(alert.id)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedId(alert.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                          alert.severity === 'danger'
                            ? 'bg-danger/15 text-danger'
                            : alert.severity === 'warning'
                              ? 'bg-warning/15 text-warning'
                              : 'bg-brand/15 text-brand',
                        )}
                      >
                        {getTypeIcon(alert.type)}
                      </div>
                      <div>
                        <p className="font-semibold text-ink">{alert.merchant}</p>
                        <p className="text-xs text-ink-soft sm:text-sm">
                          {alert.category} &bull;{' '}
                          {alert.date ? formatShortDate(alert.date) : 'Recent'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-ink sm:text-lg">
                        {formatMoney(alert.amount)}
                      </p>
                      {getStatusBadge(alert.status)}
                      <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed text-ink-soft sm:mt-3 sm:text-sm">
                    {alert.reason}
                  </p>
                </div>
              );
            })}

            {/* Pagination Controls */}
            <div className="mt-6 border-t border-line/60 pt-4">
              <Pagination
                alwaysShow
                currentPage={validCurrentPage}
                itemLabel="alerts"
                onPageChange={setCurrentPage}
                pageSize={PAGE_SIZE}
                totalItems={filteredAlerts.length}
                totalPages={totalPages}
              />
            </div>
          </div>
        ) : (
          <EmptyState
            action={
              <Button
                disabled={rescanMutation.isPending}
                onClick={() => {
                  setFilterStatus('all');
                  setSearchQuery('');
                }}
                variant="soft"
              >
                Clear filters
              </Button>
            }
            className="mt-6 rounded-[24px] px-5 py-8"
            description="No anomalies match your current filters. SpendWise is actively monitoring your transactions."
            icon={ShieldCheck}
            title="No alerts in this view"
          />
        )}
      </SurfaceCard>
    </div>
  );
}
