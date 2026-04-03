import Link from 'next/link';

import { AuthShell } from '@/components/auth/auth-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Password recovery"
      title="Recover access without stress or guesswork."
      description="The recovery flow keeps copy reassuring, confirms what happens next, and avoids revealing whether an email is registered."
      footer={
        <p className="text-sm text-slate-500">
          Remembered it?{' '}
          <Link className="font-semibold text-brand" href="/login">
            Return to login
          </Link>
        </p>
      }
    >
      <div className="space-y-7">
        <div className="space-y-2">
          <Badge variant="info">Forgot password</Badge>
          <h2 className="text-3xl font-semibold text-ink">Send reset link</h2>
          <p className="text-sm leading-7 text-slate-600">
            Ask for one input only, confirm the outcome clearly, and keep the action easy to scan.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600" htmlFor="recovery-email">
            Account email
          </label>
          <Input id="recovery-email" placeholder="you@example.com" type="email" />
        </div>

        <div className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-4 text-sm leading-6 text-slate-600">
          Success state copy should confirm that reset instructions may have been sent if the email
          matches an account. This avoids account enumeration while still feeling helpful.
        </div>

        <Button asChild className="w-full" size="lg" variant="secondary">
          <Link href="/reset-password">Email reset instructions</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
