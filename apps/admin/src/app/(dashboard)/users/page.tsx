import { listUsers } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default async function UsersPage() {
  const users = await listUsers();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Usuários</h1>
      <div className="mt-6 overflow-hidden rounded-[12px] border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-bg text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Provedores</th>
              <th className="px-4 py-3 font-medium">Cadastro</th>
              <th className="px-4 py-3 font-medium">Resgates</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.name ?? '—'}</td>
                <td className="px-4 py-3 text-ink-muted">{user.providers.join(', ')}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                </td>
                <td className="px-4 py-3">{user.redeemCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
