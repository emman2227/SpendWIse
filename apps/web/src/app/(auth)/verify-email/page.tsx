import { CheckCircle2, MailCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f2ea_0%,#f4efe7_100%)] px-3 py-3 md:flex md:min-h-screen md:items-center md:px-4 md:py-4 md:overflow-hidden">
      <div className="mx-auto w-full max-w-[1040px] overflow-hidden rounded-[22px] bg-white shadow-[0_18px_48px_rgba(18,35,47,0.1)] md:max-h-[calc(100vh-2rem)] lg:grid lg:grid-cols-[0.93fr,0.83fr]">
        <section className="relative overflow-hidden bg-[#dbe6e0] px-5 py-4 md:px-5 md:py-5 lg:min-h-[460px]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-10 top-0 h-40 w-56 rounded-full bg-white/28 blur-sm" />
            <div className="absolute right-[8%] top-[11%] h-44 w-44 rounded-full bg-[#f2eadb] opacity-95" />
            <div className="absolute left-[10%] top-[18%] h-52 w-52 rounded-[38%_62%_58%_42%/49%_41%_59%_51%] border border-white/30 bg-white/12" />
            <div className="absolute left-[18%] top-[32%] h-10 w-60 rounded-full bg-[linear-gradient(90deg,rgba(17,43,38,0.9),rgba(15,123,113,0.62),rgba(255,255,255,0.08))] opacity-90 blur-[1px]" />
            <div className="absolute -left-16 bottom-7 h-44 w-54 rounded-[46%_54%_57%_43%/44%_34%_66%_56%] bg-[#f3e3cf]" />
            <div className="absolute right-[-10%] bottom-[-10%] h-48 w-52 rounded-[58%_42%_61%_39%/44%_55%_45%_56%] bg-white/28" />
          </div>

          <div className="relative flex h-full flex-col">
            <Link href="/" className="text-lg font-extrabold tracking-[-0.04em] text-brand md:text-xl">
              SpendWise
            </Link>

            <div className="mt-6 max-w-[316px] rounded-[24px] border border-white/40 bg-white/38 p-4 shadow-[0_12px_24px_rgba(18,35,47,0.07)] backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Verification Note
                </span>
              </div>
              <p className="mt-3 max-w-[22ch] text-[13px] font-semibold leading-5 text-slate-700">
                Confirmation should remove doubt and point clearly toward the next action.
              </p>
            </div>

            <div className="relative mt-auto pt-8">
              <div className="mb-5 grid max-w-[304px] grid-cols-[1.08fr,0.92fr] gap-3">
                <div className="rounded-[26px] border border-white/35 bg-white/20 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[linear-gradient(145deg,rgba(15,53,47,0.88),rgba(15,123,113,0.68))] text-white">
                      <MailCheck className="h-5 w-5" />
                    </div>
                    <div className="h-3 w-16 rounded-full bg-brand/24" />
                  </div>
                  <div className="mt-5 h-14 rounded-[20px] border border-white/35 bg-white/18" />
                  <div className="mt-4 h-2 w-20 rounded-full bg-slate-700/14" />
                </div>
                <div className="space-y-3">
                  <div className="rounded-[22px] border border-white/35 bg-[#f5ede0] p-3">
                    <div className="flex h-14 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,rgba(15,123,113,0.2),rgba(255,255,255,0.68))] text-brand">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="rounded-[20px] border border-white/35 bg-white/24 p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-brand">
                      <Sparkles className="h-4 w-4" />
                      <div className="h-2.5 w-14 rounded-full bg-brand/24" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-[320px]">
                <h1
                  className="text-[1.95rem] font-semibold leading-[0.96] tracking-[-0.05em] text-[#13281f] md:text-[2.2rem]"
                  style={{ fontFamily: 'var(--font-fraunces)' }}
                >
                  Verification sent, <span className="text-brand">next steps ready.</span>
                </h1>
                <p className="mt-3 text-[13px] leading-6 text-slate-600">
                  Clear confirmation keeps momentum high and helps users move forward without wondering what happens next.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-4 md:px-5 md:py-5">
          <div className="mx-auto flex h-full max-w-[360px] flex-col">
            <div className="space-y-2">
              <div className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
                Verification
              </div>
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-900 md:text-[1.55rem]">
                Check Your Inbox
              </h2>
              <p className="text-[13px] leading-5 text-slate-500">
                We sent a confirmation link to your email. Open it to activate your account and continue into SpendWise.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-[20px] border border-[#ece7df] bg-[#fbf8f2] px-4 py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-brand/12 text-brand">
                <MailCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Email sent
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">maya@spendwise.app</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-[18px] border border-[#ece7df] bg-white px-4 py-3">
                <p className="text-[12px] font-semibold text-slate-700">What to do next</p>
                <p className="mt-1 text-[12px] leading-5 text-slate-500">
                  Open the verification email and click the confirmation link to finish creating your account.
                </p>
              </div>
              <div className="rounded-[18px] border border-[#ece7df] bg-[#fbf8f2] px-4 py-3">
                <p className="text-[12px] font-semibold text-slate-700">Didn&apos;t get it?</p>
                <p className="mt-1 text-[12px] leading-5 text-slate-500">
                  Check spam, resend the email, or go back to login if you already verified on another tab.
                </p>
              </div>
            </div>

            <div className="mt-auto space-y-2.5 pt-4">
              <Button
                asChild
                className="h-11 w-full rounded-full text-sm shadow-[0_12px_24px_rgba(15,123,113,0.2)]"
                size="lg"
                variant="secondary"
              >
                <Link href="/onboarding/welcome">Continue to onboarding</Link>
              </Button>
              <Button asChild className="h-10 w-full rounded-full text-sm" size="lg" variant="outline">
                <Link href="/login">Back to login</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
