import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Ban, Edit2, Eye, Shield, Loader2, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminUsers, useAdminRoles, useBanUser, useUnbanUser, useUpdateAdminUser } from '@/hooks/useAdmin';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showBanModal, setShowBanModal] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  const { data, isLoading, error } = useAdminUsers(page, 20, search || undefined);
  const { data: roles } = useAdminRoles();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const updateUser = useUpdateAdminUser();
  
  const users = data?.data ?? [];
  const meta = data?.meta;

  const handleBan = async () => {
    if (!showBanModal || !banReason) {
      toast.error('Ange en anledning');
      return;
    }
    try {
      await banUser.mutateAsync({ userId: showBanModal, reason: banReason });
      toast.success('Användare bannad');
      setShowBanModal(null);
      setBanReason('');
    } catch {
      toast.error('Kunde inte banna användare');
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      await unbanUser.mutateAsync(userId);
      toast.success('Ban borttagen');
    } catch {
      toast.error('Kunde inte ta bort ban');
    }
  };

  const handleUpdateRoles = async () => {
    if (!showRoleModal) return;
    try {
      await updateUser.mutateAsync({ userId: showRoleModal, roles: selectedRoles });
      toast.success('Roller uppdaterade');
      setShowRoleModal(null);
    } catch {
      toast.error('Kunde inte uppdatera roller');
    }
  };

  const openRoleModal = (userId: string, currentRoles: string[]) => {
    setSelectedRoles(currentRoles);
    setShowRoleModal(userId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-400">Laddar användare...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">Ett fel uppstod vid laddning av användare.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Användare</h1>
          <p className="text-gray-400">Hantera alla användare på sidan</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Sök användare..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-10"
          />
        </div>
        <button className="btn-secondary">
          <Filter className="w-5 h-5" />
          Filter
        </button>
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-darker">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Användare</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Steam ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Roller</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Registrerad</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Åtgärder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-background-darker flex items-center justify-center font-medium overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        {user.email && (
                          <div className="text-sm text-gray-400">{user.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-sm">
                    {user.steamId}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {user.roles?.map((role) => (
                        <span
                          key={role.id}
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: `${role.color}20`, color: role.color }}
                        >
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(user.createdAt).toLocaleDateString('sv-SE')}
                  </td>
                  <td className="px-6 py-4">
                    {user.isBanned ? (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                        Bannad
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                        Aktiv
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/profile/${user.id}`} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Visa profil">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </Link>
                      <button
                        onClick={() => openRoleModal(user.id, user.roles?.map(r => r.id) || [])}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        title="Hantera roller"
                      >
                        <Shield className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => user.isBanned ? handleUnban(user.id) : setShowBanModal(user.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                        title={user.isBanned ? 'Ta bort ban' : 'Banna'}
                      >
                        <Ban className={`w-4 h-4 ${user.isBanned ? 'text-red-400' : 'text-gray-400'}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Visar {users.length} av {meta?.total || users.length} användare
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
              disabled={!meta || page >= meta.totalPages}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Nästa
            </button>
          </div>
        </div>
      </motion.div>

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">Banna användare</h2>
              <button onClick={() => setShowBanModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label">Anledning</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="input resize-none"
                  rows={3}
                  placeholder="Ange anledning för ban..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowBanModal(null)} className="btn-secondary flex-1">
                Avbryt
              </button>
              <button
                onClick={handleBan}
                disabled={banUser.isPending}
                className="btn-danger flex-1"
              >
                {banUser.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Banna'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && roles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">Hantera roller</h2>
              <button onClick={() => setShowRoleModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles([...selectedRoles, role.id]);
                      } else {
                        setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-600 text-primary-600 focus:ring-primary-500"
                  />
                  <span
                    className="px-2 py-1 rounded text-sm font-medium"
                    style={{ backgroundColor: `${role.color}20`, color: role.color }}
                  >
                    {role.name}
                  </span>
                </label>
              ))}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRoleModal(null)} className="btn-secondary flex-1">
                Avbryt
              </button>
              <button
                onClick={handleUpdateRoles}
                disabled={updateUser.isPending}
                className="btn-primary flex-1"
              >
                {updateUser.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Spara'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
