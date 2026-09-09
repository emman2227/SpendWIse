import { CircleHelp, MailPlus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { faqItems } from '@/lib/demo-data';

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button variant="soft">Feature tour</Button>
            <Button variant="secondary">Contact support</Button>
          </>
        }
        description="Help should be easy to find and reassuring. Provide FAQs, feature guidance, and contextual explanations for AI insights and anomaly flags."
        eyebrow="Help and support"
        meta={
          <>
            <Badge variant="neutral">FAQ + support placeholder</Badge>
            <Badge variant="info">Contextual guidance patterns</Badge>
          </>
        }
        title="Make support feel close, clear, and kind."
      />

      <section className="grid gap-6 lg:grid-cols-[1fr,0.95fr]">
        <SurfaceCard className="rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6 sm:py-6 md:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand sm:h-11 sm:w-11">
              <CircleHelp className="h-5 w-5" />
            </div>
            <div>
              <p className="kicker">Help center</p>
              <h2 className="mt-1 text-xl font-semibold text-ink sm:mt-2 sm:text-2xl">
                Frequently asked questions
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.question}
                className="rounded-[20px] border border-line bg-paper px-4 py-4 sm:rounded-[24px] sm:px-5 sm:py-5"
              >
                <p className="text-sm font-semibold text-ink sm:text-base">{item.question}</p>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft sm:mt-3 sm:text-sm sm:leading-6">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <div className="space-y-4 sm:space-y-6">
          <SurfaceCard className="rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6 sm:py-6 md:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand sm:h-11 sm:w-11">
                <MailPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="kicker">Support placeholder</p>
                <h2 className="mt-1 text-xl font-semibold text-ink sm:mt-2 sm:text-2xl">
                  Contact support
                </h2>
              </div>
            </div>
            <div className="mt-5 rounded-[20px] border border-line bg-paper px-4 py-4 sm:mt-6 sm:rounded-[24px] sm:px-5 sm:py-5">
              <p className="text-xs leading-relaxed text-ink-soft sm:text-sm sm:leading-6">
                Keep support entry points visible in the global shell, and surface relevant help
                inside insights, alerts, and forecast modules when users need context.
              </p>
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6 sm:py-6 md:px-7">
            <p className="kicker">Contextual tips</p>
            <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
              {[
                'Use inline "Why am I seeing this?" links on AI insight cards',
                'Explain anomaly flags beside the action buttons, not in a hidden tooltip',
                'Offer chart legends and value summaries on smaller screens',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[20px] border border-line bg-sage/30 px-4 py-4 sm:rounded-[24px] sm:px-5 sm:py-5"
                >
                  <p className="text-xs font-semibold text-ink sm:text-sm">{item}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </section>
    </div>
  );
}
