import Link from 'next/link';

const featureCards = [
  {
    title: 'Cross-platform foundation',
    description: 'Next.js web, Expo mobile, shared TypeScript contracts, and a NestJS API are ready from day one.'
  },
  {
    title: 'AI-ready analytics layer',
    description: 'Provider abstraction and mock forecasting let you plug in Gemini or another LLM provider later without rewriting your app.'
  },
  {
    title: 'Growth-minded architecture',
    description: 'Feature modules, repository boundaries, validation, logging, and seed structure make the capstone starter feel production-aware.'
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-mesh">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-12 px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
          <div className="space-y-8">
            <span className="inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-brand shadow-sm">
              SpendWise Monorepo Starter
            </span>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-ink md:text-6xl">
                Understand spending behavior with a product foundation built to scale.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Scaffolded for authentication, expense tracking, budgets, insights, and AI-assisted forecasts across web, mobile, and API layers.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Open dashboard
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 hover:border-brand hover:text-brand"
              >
                View auth starter
              </Link>
            </div>
          </div>

          <div className="rounded-[36px] border border-white/70 bg-white/90 p-8 shadow-soft backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Starter scope</p>
            <div className="mt-6 space-y-5">
              {featureCards.map((card) => (
                <article key={card.title} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <h2 className="text-xl font-semibold text-ink">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
