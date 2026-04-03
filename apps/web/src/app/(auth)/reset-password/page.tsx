import Link from 'next/link';

import { AuthShell } from '@/components/auth/auth-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Reset password"
      title="Create a new password and continue with confidence."
      description="This screen should focus on clarity: new password, confirm password, strength guidance, and a strong success path back into the app."
      footer={
        <p className="text-sm text-slate-500">
          Need the link again?{' '}
          <Link className="font-semibold text-brand" href="/forgot-password">
            Resend recovery email
          </Link>
        </p>
      }
    >
      <div className="space-y-7">
        <div className="space-y-2">
          <Badge variant="warning">Reset flow</Badge>
          <h2 className="text-3xl font-semibold text-ink">Choose a new password</h2>
          <p className="text-sm leading-7 text-slate-600">
            Validation should appear inline, with helpful rules before the user submits.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="new-password">
              New password
            </label>
            <Input id="new-password" placeholder="Create a strong password" type="password" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="confirm-new-password">
              Confirm password
            </label>
            <Input
              id="confirm-new-password"
              placeholder="Repeat your new password"
              type="password"
            />
          </div>
        </div>

        <div className="rounded-[24px] border border-white/80 bg-sage/30 px-5 py-4 text-sm leading-6 text-slate-600">
          Suggested helper text: at least 10 characters, a mix of upper and lower case, and one
          number. Show confirmation as soon as both passwords match.
        </div>

        <Button asChild className="w-full" size="lg" variant="secondary">
          <Link href="/login">Save new password</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
