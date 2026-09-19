'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="rounded-[12px] border border-border bg-surface p-6">
      <p className="font-medium text-ink">Não consegui carregar esta tela.</p>
      <p className="mt-1 text-sm text-ink-muted">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-[10px] bg-primary px-4 py-2 text-sm text-white"
      >
        Tentar de novo
      </button>
    </div>
  );
}
