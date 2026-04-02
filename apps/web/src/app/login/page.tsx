export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fcfaf4] px-6 py-16">
      <div className="grid w-full max-w-5xl gap-10 rounded-[36px] border border-white/70 bg-white/90 p-8 shadow-soft backdrop-blur lg:grid-cols-[0.95fr,1.05fr]">
        <section className="rounded-[28px] bg-gradient-to-br from-ink to-brand p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">Authentication starter</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Secure sign-in flow with JWT access and refresh tokens.</h1>
          <p className="mt-4 text-base leading-7 text-white/80">
            The API scaffold already includes register, login, logout, refresh, protected profile routes, and validation. This page is ready to connect to those endpoints next.
          </p>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-8">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">Email</label>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 transition focus:border-brand"
                type="email"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">Password</label>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 transition focus:border-brand"
                type="password"
                placeholder="Enter your password"
              />
            </div>
            <button className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Continue
            </button>
            <p className="text-sm leading-6 text-slate-500">
              TODO: connect this form to <code>POST /api/v1/auth/login</code> and persist the access token in an HttpOnly cookie from your backend adapter.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
