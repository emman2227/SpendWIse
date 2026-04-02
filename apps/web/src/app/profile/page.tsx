export default function ProfilePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fcfaf4] px-6 py-16">
      <div className="max-w-2xl rounded-[32px] border border-slate-200 bg-white p-10 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Protected route starter</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink">Profile area placeholder</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          This route is intentionally protected by <code>middleware.ts</code>. Once your backend issues an HttpOnly access cookie, authenticated users can land here or in any other secured area.
        </p>
      </div>
    </main>
  );
}
