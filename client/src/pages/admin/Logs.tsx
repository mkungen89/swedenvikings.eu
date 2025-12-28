import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, RefreshCw, Loader2 } from 'lucide-react';
import { useAdminLogs } from '@/hooks/useAdmin';

const levelColors: Record<string, { bg: string; text: string }> = {
  debug: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  info: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  warning: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  error: { bg: 'bg-red-500/20', text: 'text-red-400' },
};

export default function AdminLogs() {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  
  const { data, isLoading, error, refetch } = useAdminLogs(page, 50, categoryFilter || undefined);
  
  const logs = data?.data ?? [];
  const meta = data?.meta;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.action?.toLowerCase().includes(search.toLowerCase()) || 
                          (log.details && JSON.stringify(log.details).toLowerCase().includes(search.toLowerCase()));
    const matchesLevel = !levelFilter || log.category === levelFilter;
    return matchesSearch && matchesLevel;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-400">Laddar loggar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">Ett fel uppstod vid laddning av loggar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Loggar</h1>
          <p className="text-gray-400">Se aktivitetsloggar</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-secondary">
            <RefreshCw className="w-5 h-5" />
            Uppdatera
          </button>
          <button className="btn-secondary">
            <Download className="w-5 h-5" />
            Exportera
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Sök i loggar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">Alla kategorier</option>
          <option value="auth">Auth</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="content">Content</option>
          <option value="server">Server</option>
        </select>
      </div>

      {/* Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-darker">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Tid</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Användare</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Kategori</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Åtgärd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-sm">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('sv-SE')}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {log.user?.avatar ? (
                        <img src={log.user.avatar} alt="" className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-background-darker flex items-center justify-center text-xs">
                          {log.user?.username?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="text-gray-300">{log.user?.username || 'System'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-gray-400 capitalize">
                      {log.category}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-300">
                    {log.action}
                    {log.details && (
                      <span className="text-gray-500 ml-2">
                        {typeof log.details === 'object' ? JSON.stringify(log.details).slice(0, 50) : String(log.details)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Inga loggar matchar dina filter.
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Sida {page} av {meta.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                Föregående
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= meta.totalPages}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                Nästa
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
