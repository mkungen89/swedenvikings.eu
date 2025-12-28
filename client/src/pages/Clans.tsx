import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Crown, Search, Plus, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useClansList, useCreateClan } from '@/hooks/useClans';
import toast from 'react-hot-toast';

export default function Clans() {
  const { isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState('');
  const [showRecruiting, setShowRecruiting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClan, setNewClan] = useState({ name: '', tag: '', description: '', color: '#6366f1' });
  
  const { data, isLoading, error } = useClansList(1, 50, showRecruiting || undefined);
  const createClan = useCreateClan();
  
  const clans = data?.data ?? [];

  const filteredClans = clans.filter((clan) => {
    const matchesSearch = clan.name.toLowerCase().includes(search.toLowerCase()) ||
      clan.tag.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleCreateClan = async () => {
    if (!newClan.name || !newClan.tag) {
      toast.error('Namn och tag krävs');
      return;
    }
    try {
      await createClan.mutateAsync(newClan);
      toast.success('Clan skapad!');
      setShowCreateModal(false);
      setNewClan({ name: '', tag: '', description: '', color: '#6366f1' });
    } catch {
      toast.error('Kunde inte skapa clan');
    }
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-gray-400">Laddar clans...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <p className="text-red-400">Ett fel uppstod vid laddning av clans.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl font-bold mb-2">Clans</h1>
              <p className="text-gray-400">
                Utforska och gå med i en clan för att spela med likasinnade.
              </p>
            </div>
            {isAuthenticated && (
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                <Plus className="w-5 h-5" />
                Skapa Clan
              </button>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Sök clans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-background-card rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={showRecruiting}
              onChange={(e) => setShowRecruiting(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm">Visa endast rekryterande</span>
          </label>
        </motion.div>

        {/* Clans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClans.map((clan, index) => (
            <motion.div
              key={clan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/clans/${clan.id}`}>
                <div className="card-hover p-6 h-full">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center font-display font-bold text-xl text-white"
                      style={{ backgroundColor: clan.color }}
                    >
                      {clan.tag}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-display font-semibold text-lg truncate">
                          {clan.name}
                        </h2>
                        {clan.isRecruiting && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                            Rekryterar
                          </span>
                        )}
                      </div>
                      {clan.leader && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Crown className="w-4 h-4" />
                          {clan.leader.username}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {clan.description || 'Ingen beskrivning.'}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-4 h-4" />
                      {clan.memberCount || 0} medlemmar
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: clan.color }}
                    >
                      [{clan.tag}]
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {filteredClans.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">Inga clans hittades.</p>
          </div>
        )}

        {/* Create Clan Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-6 w-full max-w-md"
            >
              <h2 className="font-display text-xl font-semibold mb-4">Skapa ny clan</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="label">Namn</label>
                  <input
                    type="text"
                    value={newClan.name}
                    onChange={(e) => setNewClan({ ...newClan, name: e.target.value })}
                    className="input"
                    placeholder="Min Clan"
                  />
                </div>
                
                <div>
                  <label className="label">Tag (2-4 tecken)</label>
                  <input
                    type="text"
                    value={newClan.tag}
                    onChange={(e) => setNewClan({ ...newClan, tag: e.target.value.toUpperCase().slice(0, 4) })}
                    className="input"
                    placeholder="MC"
                    maxLength={4}
                  />
                </div>
                
                <div>
                  <label className="label">Beskrivning</label>
                  <textarea
                    value={newClan.description}
                    onChange={(e) => setNewClan({ ...newClan, description: e.target.value })}
                    className="input resize-none"
                    rows={3}
                    placeholder="Beskriv din clan..."
                  />
                </div>
                
                <div>
                  <label className="label">Färg</label>
                  <div className="flex gap-2">
                    {['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#6366f1', '#ec4899'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewClan({ ...newClan, color })}
                        className={`w-8 h-8 rounded-lg transition-transform ${
                          newClan.color === color ? 'scale-110 ring-2 ring-white' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleCreateClan}
                  disabled={createClan.isPending}
                  className="btn-primary flex-1"
                >
                  {createClan.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Skapa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
