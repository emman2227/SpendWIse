'use client';

import { SUPPORTED_CURRENCIES, type UserProfile } from '@spendwise/shared';
import { useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, Coins, Globe2, Laptop, Moon, Save, Search, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SurfaceCard } from '@/components/ui/surface-card';
import { authQueryKey, getAuthErrorMessage, updateProfile } from '@/lib/auth/client';
import { cn } from '@/lib/utils';

interface PreferencesSettingsPanelProps {
  user: UserProfile | null | undefined;
}

export function PreferencesSettingsPanel({ user }: PreferencesSettingsPanelProps) {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency ?? 'PHP');
  const [currencySearch, setCurrencySearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<{
    tone: 'success' | 'danger';
    text: string;
  } | null>(null);

  // Localization preferences in localStorage
  const [dateFormat, setDateFormat] = useState('MMM D, YYYY');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState('sunday');

  useEffect(() => {
    setMounted(true);
    if (user?.currency) {
      setSelectedCurrency(user.currency);
    }
    const savedDateFormat = localStorage.getItem('spendwise_date_format');
    if (savedDateFormat) setDateFormat(savedDateFormat);

    const savedFirstDay = localStorage.getItem('spendwise_first_day');
    if (savedFirstDay) setFirstDayOfWeek(savedFirstDay);
  }, [user?.currency]);

  const handleSaveAllPreferences = async () => {
    setIsSaving(true);
    setSaveNotice(null);

    try {
      // Save date and calendar preferences to localStorage
      localStorage.setItem('spendwise_date_format', dateFormat);
      localStorage.setItem('spendwise_first_day', firstDayOfWeek);

      // Save currency to database profile if changed or ensure persisted
      let updatedUser = user;
      if (selectedCurrency !== user?.currency) {
        updatedUser = await updateProfile({ currency: selectedCurrency });
        queryClient.setQueryData(authQueryKey, updatedUser);
        await queryClient.invalidateQueries();
      }

      setSaveNotice({
        tone: 'success',
        text: `Preferences saved successfully! Workspace currency set to ${selectedCurrency}.`,
      });
    } catch (error) {
      setSaveNotice({
        tone: 'danger',
        text: getAuthErrorMessage(error, 'Unable to save preferences. Please try again.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.label.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.symbol.includes(currencySearch),
  );

  const activeCurrencyObj =
    SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency) ?? SUPPORTED_CURRENCIES[0];

  return (
    <div className="space-y-8">
      {/* Visual Theme Section */}
      <SurfaceCard className="rounded-[32px] p-6 sm:p-8 md:p-9 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-brand/10 text-brand sm:h-16 sm:w-16 sm:rounded-[24px]">
            <Sun className="h-7 w-7" />
          </div>
          <div>
            <p className="kicker">Interface & Theme</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Theme & Appearance
            </h2>
            <p className="mt-1.5 text-xs text-ink-soft sm:text-sm leading-relaxed">
              Customize how SpendWise adapts to your display preferences and ambient lighting
              conditions.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {/* Light Theme Card */}
          <button
            onClick={() => setTheme('light')}
            type="button"
            className={cn(
              'group relative flex flex-col items-start overflow-hidden rounded-[26px] border p-6 text-left transition-all duration-200',
              mounted && theme === 'light'
                ? 'border-brand bg-brand/5 ring-2 ring-brand/30 shadow-soft'
                : 'border-line bg-paper hover:border-brand/30 hover:bg-paper-strong',
            )}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <Sun className="h-5 w-5" />
              </div>
              {mounted && theme === 'light' && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
            <p className="mt-5 text-base font-bold text-ink">Light Mode</p>
            <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">
              Crisp daylight palette optimized for bright lighting and clarity.
            </p>
            <div className="mt-5 flex w-full gap-2 rounded-xl border border-line/60 bg-white p-2.5 shadow-xs">
              <div className="h-3.5 w-9 rounded-full bg-slate-200" />
              <div className="h-3.5 w-16 rounded-full bg-emerald-100" />
              <div className="h-3.5 w-7 rounded-full bg-slate-100" />
            </div>
          </button>

          {/* Dark Theme Card */}
          <button
            onClick={() => setTheme('dark')}
            type="button"
            className={cn(
              'group relative flex flex-col items-start overflow-hidden rounded-[26px] border p-6 text-left transition-all duration-200',
              mounted && theme === 'dark'
                ? 'border-brand bg-brand/5 ring-2 ring-brand/30 shadow-soft'
                : 'border-line bg-paper hover:border-brand/30 hover:bg-paper-strong',
            )}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                <Moon className="h-5 w-5" />
              </div>
              {mounted && theme === 'dark' && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
            <p className="mt-5 text-base font-bold text-ink">Dark Mode</p>
            <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">
              Deep, high-contrast dark tones that reduce eye strain at night.
            </p>
            <div className="mt-5 flex w-full gap-2 rounded-xl border border-slate-700 bg-slate-900 p-2.5 shadow-xs">
              <div className="h-3.5 w-9 rounded-full bg-slate-700" />
              <div className="h-3.5 w-16 rounded-full bg-emerald-900/60" />
              <div className="h-3.5 w-7 rounded-full bg-slate-800" />
            </div>
          </button>

          {/* System Theme Card */}
          <button
            onClick={() => setTheme('system')}
            type="button"
            className={cn(
              'group relative flex flex-col items-start overflow-hidden rounded-[26px] border p-6 text-left transition-all duration-200',
              mounted && theme === 'system'
                ? 'border-brand bg-brand/5 ring-2 ring-brand/30 shadow-soft'
                : 'border-line bg-paper hover:border-brand/30 hover:bg-paper-strong',
            )}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Laptop className="h-5 w-5" />
              </div>
              {mounted && theme === 'system' && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
            <p className="mt-5 text-base font-bold text-ink">System Sync</p>
            <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">
              Automatically follows your operating system&apos;s light/dark schedule.
            </p>
            <div className="mt-5 flex w-full gap-2 rounded-xl border border-line/60 bg-gradient-to-r from-white to-slate-900 p-2.5 shadow-xs">
              <div className="h-3.5 w-9 rounded-full bg-slate-300 dark:bg-slate-700" />
              <div className="h-3.5 w-16 rounded-full bg-emerald-200 dark:bg-emerald-800" />
              <div className="h-3.5 w-7 rounded-full bg-slate-200 dark:bg-slate-600" />
            </div>
          </button>
        </div>
      </SurfaceCard>

      {/* Currency & Financial Units Section */}
      <SurfaceCard className="rounded-[32px] p-6 sm:p-8 md:p-9 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-brand/10 text-brand sm:h-16 sm:w-16 sm:rounded-[24px]">
              <Coins className="h-7 w-7" />
            </div>
            <div>
              <p className="kicker">Financial Units</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Primary Currency
              </h2>
              <p className="mt-1.5 text-xs text-ink-soft sm:text-sm leading-relaxed">
                The standard currency symbol and code used across your dashboard, budgets, goals,
                and analytics.
              </p>
            </div>
          </div>

          {/* Current Live Currency Preview Badge */}
          {activeCurrencyObj && (
            <div className="flex items-center gap-3.5 rounded-[24px] border border-line bg-paper px-5 py-3.5 shadow-xs">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-xl font-bold text-brand">
                {activeCurrencyObj.symbol}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                  Selected Currency
                </p>
                <p className="text-sm font-bold text-ink">
                  {activeCurrencyObj.code} · {activeCurrencyObj.label}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Currency Selector Grid */}
        <div className="mt-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <Input
                value={currencySearch}
                onChange={(e) => setCurrencySearch(e.target.value)}
                placeholder="Search currencies by code, country, or symbol (e.g. PHP, USD, EUR, $)..."
                className="h-12 rounded-[20px] bg-paper pl-11 text-sm"
              />
            </div>
          </div>

          <div className="grid max-h-[380px] gap-3 overflow-y-auto p-1 pr-2 sm:grid-cols-2 md:grid-cols-3 [scrollbar-width:thin]">
            {filteredCurrencies.map((item) => {
              const isSelected = item.code === selectedCurrency;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setSelectedCurrency(item.code);
                    setSaveNotice(null);
                  }}
                  className={cn(
                    'group flex items-center justify-between rounded-[22px] border p-4 text-left transition-all duration-150',
                    isSelected
                      ? 'border-brand bg-brand/10 ring-2 ring-brand/30 shadow-xs'
                      : 'border-line bg-paper hover:border-brand/40 hover:bg-paper-strong',
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold transition-colors',
                        isSelected
                          ? 'bg-brand text-white'
                          : 'bg-paper-strong text-ink border border-line/60',
                      )}
                    >
                      {item.symbol}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{item.code}</p>
                      <p className="truncate text-xs text-ink-soft">{item.label}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </SurfaceCard>

      {/* Localization & Display Settings */}
      <SurfaceCard className="rounded-[32px] p-6 sm:p-8 md:p-9 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-brand/10 text-brand sm:h-16 sm:w-16 sm:rounded-[24px]">
            <Globe2 className="h-7 w-7" />
          </div>
          <div>
            <p className="kicker">Regional & Formatting</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Date & Calendar Formatting
            </h2>
            <p className="mt-1.5 text-xs text-ink-soft sm:text-sm leading-relaxed">
              Configure how dates and weekly budgeting cycles appear across your workspace.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {/* Date format selector */}
          <div className="rounded-[24px] border border-line bg-paper p-5 space-y-3">
            <label className="text-xs font-semibold text-ink sm:text-sm">Date Display Format</label>
            <select
              value={dateFormat}
              onChange={(e) => {
                setDateFormat(e.target.value);
                setSaveNotice(null);
              }}
              className="h-12 w-full rounded-[18px] border border-line bg-surface px-4 text-sm text-ink outline-none transition focus:border-brand focus:ring-1 focus:ring-brand/30"
            >
              <option value="MMM D, YYYY">Sep 14, 2026 (Standard Month Name)</option>
              <option value="DD/MM/YYYY">14/09/2026 (International Day First)</option>
              <option value="MM/DD/YYYY">09/14/2026 (US Month First)</option>
              <option value="YYYY-MM-DD">2026-09-14 (ISO Standard)</option>
            </select>
            <p className="text-[11px] text-ink-soft leading-relaxed">
              Used in transaction listings, exports, and history charts.
            </p>
          </div>

          {/* First day of week */}
          <div className="rounded-[24px] border border-line bg-paper p-5 space-y-3">
            <label className="text-xs font-semibold text-ink sm:text-sm">
              First Day of the Week
            </label>
            <select
              value={firstDayOfWeek}
              onChange={(e) => {
                setFirstDayOfWeek(e.target.value);
                setSaveNotice(null);
              }}
              className="h-12 w-full rounded-[18px] border border-line bg-surface px-4 text-sm text-ink outline-none transition focus:border-brand focus:ring-1 focus:ring-brand/30"
            >
              <option value="sunday">Sunday</option>
              <option value="monday">Monday</option>
            </select>
            <p className="text-[11px] text-ink-soft leading-relaxed">
              Configures calendar matrices and weekly rollup computations.
            </p>
          </div>
        </div>

        {saveNotice && (
          <div
            className={cn(
              'mt-6 flex items-center gap-2 rounded-[20px] p-4 text-xs font-semibold sm:text-sm',
              saveNotice.tone === 'success'
                ? 'border border-brand/20 bg-brand/10 text-brand-strong'
                : 'border border-danger/20 bg-danger/10 text-danger',
            )}
          >
            {saveNotice.tone === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />
            ) : null}
            <span>{saveNotice.text}</span>
          </div>
        )}

        {/* Dedicated Save Preferences Action Bar */}
        <div className="mt-8 flex flex-col gap-3 pt-4 border-t border-line sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-soft">
            Click save to persist your currency and display formatting across all workspace devices.
          </p>
          <Button
            disabled={isSaving}
            onClick={handleSaveAllPreferences}
            variant="secondary"
            className="gap-2 rounded-[18px] px-6 h-12"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving preferences...' : 'Save all preferences'}</span>
          </Button>
        </div>
      </SurfaceCard>
    </div>
  );
}
