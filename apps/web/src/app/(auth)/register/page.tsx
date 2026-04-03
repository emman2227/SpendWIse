import Link from 'next/link';

import { AuthShell } from '@/components/auth/auth-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Create account"
      title="Build your finance command center in a few calm steps."
      description="Create your SpendWise account, verify your email, and move directly into a guided setup that tailors budgets, alerts, and AI explanations."
      footer={
        <p className="text-sm text-slate-500">
          Already have an account?{' '}
          <Link className="font-semibold text-brand" href="/login">
            Log in instead
          </Link>
        </p>
      }
    >
      <div className="space-y-7">
        <div className="space-y-2">
          <Badge variant="success">Guided account setup</Badge>
          <h2 className="text-3xl font-semibold text-ink">Create your account</h2>
          <p className="text-sm leading-7 text-slate-600">
            Keep forms short, labels explicit, and trust language visible near the primary action.
          </p>
        </div>

        <form className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600" htmlFor="first-name">
                First name
              </label>
              <Input id="first-name" placeholder="Maya" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600" htmlFor="last-name">
                Last name
              </label>
              <Input id="last-name" placeholder="Tan" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="register-email">
              Email address
            </label>
            <Input id="register-email" placeholder="you@example.com" type="email" />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600" htmlFor="password">
                Password
              </label>
              <Input id="password" placeholder="Create a password" type="password" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600" htmlFor="confirm-password">
                Confirm password
              </label>
              <Input id="confirm-password" placeholder="Repeat password" type="password" />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-sage/30 px-5 py-4 text-sm leading-6 text-slate-600">
            After registration, the next screen should confirm success and guide the user into
            verification or onboarding without dumping them onto a blank dashboard.
          </div>

          <Button asChild className="w-full" size="lg" variant="secondary">
            <Link href="/verify-email">Create account</Link>
          </Button>

          <p className="text-xs leading-6 text-slate-500">
            By continuing, users agree to SpendWise terms and understand their data powers insights,
            anomaly alerts, and forecasts.
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
