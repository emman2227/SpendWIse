import Link from 'next/link';

import { AuthShell } from '@/components/auth/auth-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const providers = ['Google', 'Apple', 'GitHub'];

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Authentication"
      title="Welcome back to a calmer money routine."
      description="Sign in to review budgets, unusual activity, AI insights, and the latest outlook on your month."
      footer={
        <p className="text-sm text-slate-500">
          New to SpendWise?{' '}
          <Link className="font-semibold text-brand" href="/register">
            Create an account
          </Link>
        </p>
      }
    >
      <div className="space-y-7">
        <div className="space-y-2">
          <Badge variant="info">Minimal and trust-focused</Badge>
          <h2 className="text-3xl font-semibold text-ink">Log in</h2>
          <p className="text-sm leading-7 text-slate-600">
            Clear validation, quiet recovery states, and fast access to your finance workspace.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {providers.map((provider) => (
            <button
              key={provider}
              className="rounded-[20px] border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
              type="button"
            >
              Continue with {provider}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-slate-400">
          <span className="h-px flex-1 bg-line" />
          or use email
          <span className="h-px flex-1 bg-line" />
        </div>

        <form className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="email">
              Email address
            </label>
            <Input id="email" placeholder="you@example.com" type="email" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-slate-600" htmlFor="password">
                Password
              </label>
              <Link className="text-sm font-semibold text-brand" href="/forgot-password">
                Forgot password?
              </Link>
            </div>
            <Input id="password" placeholder="Enter your password" type="password" />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-[22px] bg-sage/40 px-4 py-3 text-sm text-slate-600">
            <span>Use this pattern for loading, error, and success feedback inside the form.</span>
            <Badge variant="neutral">State-aware</Badge>
          </div>

          <Button className="w-full" size="lg" variant="secondary">
            Continue to SpendWise
          </Button>

          <p className="text-sm leading-6 text-slate-500">
            If sign-in fails, keep the error inline under the relevant field and preserve entered
            values so recovery feels low-stress.
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
