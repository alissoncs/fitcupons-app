import { listIngestion } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default async function IngestionPage() {
  const runs = await listIngestion();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Ingestão</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Conector sem credencial aparece como não configurado, não como erro.
      </p>
      <div className="mt-6 overflow-hidden rounded-[12px] border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Fonte</th>
              <th className="px-4 py-3 font-medium">Início</th>
              <th className="px-4 py-3 font-medium">Vistos / criados / atualizados</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{run.source}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {format(new Date(run.startedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </td>
                <td className="px-4 py-3">
                  {run.itemsSeen} / {run.itemsCreated} / {run.itemsUpdated}
                </td>
                <td className="px-4 py-3">
                  {run.status}
                  {run.error ? <span className="ml-2 text-xs text-ink-muted">{run.error}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
