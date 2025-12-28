import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Shield, Users, Loader2, X } from 'lucide-react';
import { useAdminRoles, useAdminPermissions, useCreateRole } from '@/hooks/useAdmin';
import toast from 'react-hot-toast';

export default function AdminRoles() {
  const [showCreate, setShowCreate] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', color: '#6366f1', priority: 0, permissions: [] as string[] });
  
  const { data: roles, isLoading, error } = useAdminRoles();
  const { data: permissionCategories } = useAdminPermissions();
  const createRole = useCreateRole();

  const handleCreateRole = async () => {
    if (!newRole.name) {
      toast.error('Namn krävs');
      return;
    }
    try {
      await createRole.mutateAsync(newRole);
      toast.success('Roll skapad!');
      setShowCreate(false);
      setNewRole({ name: '', color: '#6366f1', priority: 0, permissions: [] });
    } catch {
      toast.error('Kunde inte skapa roll');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-400">Laddar roller...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">Ett fel uppstod vid laddning av roller.</p>
      </div>
    );
  }

  const rolesList = roles || [];
  const categories = permissionCategories ? Object.entries(permissionCategories) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Roller</h1>
          <p className="text-gray-400">Hantera roller och behörigheter</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-5 h-5" />
          Skapa Roll
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rolesList.map((role, index) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${role.color}20` }}
                >
                  <Shield className="w-5 h-5" style={{ color: role.color }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: role.color }}>{role.name}</h3>
                  <div className="text-sm text-gray-400">Prioritet: {role.priority}</div>
                </div>
              </div>
              {role.isDefault && (
                <span className="px-2 py-0.5 bg-primary-600/20 text-primary-400 text-xs rounded">
                  Standard
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <Users className="w-4 h-4" />
              {role.userCount || 0} användare
            </div>

            <div className="flex gap-2">
              <button className="btn-secondary flex-1 text-sm">
                <Edit2 className="w-4 h-4" />
                Redigera
              </button>
              {!role.isDefault && (
                <button className="btn-danger p-2" title="Ta bort">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Permissions Overview */}
      {categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h2 className="font-display text-lg font-semibold mb-6">Behörighetsöversikt</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Behörighet</th>
                  {rolesList.map((role) => (
                    <th key={role.id} className="text-center py-3 px-4">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: `${role.color}20`, color: role.color }}
                      >
                        {role.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map(([categoryKey, permissions]) => (
                  <>
                    <tr key={categoryKey}>
                      <td colSpan={rolesList.length + 1} className="py-3 px-4 bg-background-darker font-medium capitalize">
                        {categoryKey}
                      </td>
                    </tr>
                    {(permissions as Array<{ id: string; key: string; name: string }>).map((permission) => (
                      <tr key={permission.id} className="border-t border-white/5">
                        <td className="py-3 px-4 text-sm text-gray-400">{permission.name || permission.key}</td>
                        {rolesList.map((role) => (
                          <td key={role.id} className="text-center py-3 px-4">
                            <input
                              type="checkbox"
                              defaultChecked={role.permissions?.includes(permission.key)}
                              className="w-4 h-4 rounded border-gray-600 text-primary-600 focus:ring-primary-500"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Create Role Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">Skapa ny roll</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label">Namn</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="input"
                  placeholder="Rollnamn"
                />
              </div>
              
              <div>
                <label className="label">Prioritet</label>
                <input
                  type="number"
                  value={newRole.priority}
                  onChange={(e) => setNewRole({ ...newRole, priority: parseInt(e.target.value) || 0 })}
                  className="input"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Högre prioritet = mer viktig roll</p>
              </div>
              
              <div>
                <label className="label">Färg</label>
                <div className="flex gap-2">
                  {['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#6366f1', '#ec4899', '#8b5cf6'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewRole({ ...newRole, color })}
                      className={`w-8 h-8 rounded-lg transition-transform ${
                        newRole.color === color ? 'scale-110 ring-2 ring-white' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                Avbryt
              </button>
              <button
                onClick={handleCreateRole}
                disabled={createRole.isPending}
                className="btn-primary flex-1"
              >
                {createRole.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Skapa'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
