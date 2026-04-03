import { CheckCircle2, MailCheck } from 'lucide-react';
import Link from 'next/link';

import { AuthShell } from '@/components/auth/auth-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  return (
    <AuthShell
      eyebrow="Verification"
      title="Your account is ready for the next step."
      description="Use a success-oriented confirmation state that removes uncertainty and points users directly into onboarding."
    >
      <div className="space-y-7">
        <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-brand/10 text-brand">
          <MailCheck className="h-8 w-8" />
        </div>

        <div className="space-y-3">
          <Badge variant="success">Verification sent</Badge>
          <h2 className="text-3xl font-semibold text-ink">Check your inbox</h2>
          <p className="max-w-xl text-sm leading-7 text-slate-600">
            We sent a confirmation link to{' '}
            <span className="font-semibold text-ink">maya@spendwise.app</span>. After verification,
            guide the user directly into onboarding instead of leaving them at a dead end.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald" />
              <p className="font-semibold text-ink">Success state essentials</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Show confirmation, next action, and fallback support if the email does not arrive.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-sage/30 px-5 py-5">
            <p className="font-semibold text-ink">Fallback actions</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Resend email, change address, and contact support should remain easy to find.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/onboarding/welcome">Continue to onboarding</Link>
          </Button>
          <Button asChild variant="soft">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
