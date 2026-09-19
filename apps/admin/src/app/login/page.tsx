import { LoginForm } from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith('/') ? params.next : '/offers';

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-md rounded-[12px] border border-border bg-surface p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          fitcupons
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Painel de curadoria</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Entre com e-mail e senha de administrador.
        </p>
        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}
