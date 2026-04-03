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

      <section className="grid gap-6 xl:grid-cols-[1fr,0.95fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <CircleHelp className="h-5 w-5" />
            </div>
            <div>
              <p className="kicker">Help center</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Frequently asked questions</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.question}
                className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5"
              >
                <p className="font-semibold text-ink">{item.question}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <MailPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="kicker">Support placeholder</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Contact support</h2>
              </div>
            </div>
            <div className="mt-6 rounded-[24px] border border-white/80 bg-white/80 px-5 py-5">
              <p className="text-sm leading-6 text-slate-600">
                Keep support entry points visible in the global shell, and surface relevant help
                inside insights, alerts, and forecast modules when users need context.
              </p>
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
            <p className="kicker">Contextual tips</p>
            <div className="mt-5 space-y-4">
              {[
                'Use inline "Why am I seeing this?" links on AI insight cards',
                'Explain anomaly flags beside the action buttons, not in a hidden tooltip',
                'Offer chart legends and value summaries on smaller screens',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] border border-white/80 bg-sage/30 px-5 py-5"
                >
                  <p className="font-semibold text-ink">{item}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </section>
    </div>
  );
}
