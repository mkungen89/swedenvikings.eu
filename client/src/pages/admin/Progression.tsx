import { useState } from 'react';
import { Plus, Trophy, Award, Edit, Trash2, Save, X } from 'lucide-react';
import {
  useMedals,
  useCreateMedal,
  useUpdateMedal,
  useDeleteMedal,
  type Medal,
} from '@/hooks/useMedals';
import {
  useAchievements,
  useCreateAchievement,
  useUpdateAchievement,
  useDeleteAchievement,
  type Achievement,
} from '@/hooks/useAchievements';

type Tab = 'medals' | 'achievements';
type MedalTier = 'bronze' | 'silver' | 'gold' | 'platinum';
type MedalRarity = 'common' | 'rare' | 'epic' | 'legendary';

export default function AdminProgression() {
  const [activeTab, setActiveTab] = useState<Tab>('medals');
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<Medal | Achievement | null>(null);

  // Medals
  const { data: medals, isLoading: medalsLoading } = useMedals();
  const createMedal = useCreateMedal();
  const updateMedal = useUpdateMedal();
  const deleteMedal = useDeleteMedal();

  // Achievements
  const { data: achievements, isLoading: achievementsLoading } = useAchievements({ includeHidden: true });
  const createAchievement = useCreateAchievement();
  const updateAchievement = useUpdateAchievement();
  const deleteAchievement = useDeleteAchievement();

  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    icon: '',
    category: 'combat',
    tier: 'bronze',
    rarity: 'common',
    requirement: { type: 'kills', value: 1 },
    xpReward: 100,
    isHidden: false,
  });

  const handleCreate = async () => {
    try {
      if (activeTab === 'medals') {
        await createMedal.mutateAsync({
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          category: formData.category,
          tier: formData.tier,
          rarity: formData.rarity,
          requirement: formData.requirement,
        });
      } else {
        await createAchievement.mutateAsync({
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          category: formData.category,
          requirement: formData.requirement,
          xpReward: formData.xpReward,
          isHidden: formData.isHidden,
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error creating:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    try {
      if (activeTab === 'medals') {
        await updateMedal.mutateAsync({
          id: editingItem.id,
          ...formData,
        });
      } else {
        await updateAchievement.mutateAsync({
          id: editingItem.id,
          ...formData,
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta?')) return;

    try {
      if (activeTab === 'medals') {
        await deleteMedal.mutateAsync(id);
      } else {
        await deleteAchievement.mutateAsync(id);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const startEdit = (item: Medal | Achievement) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      icon: item.icon,
      category: item.category,
      tier: (item as Medal).tier || 'bronze',
      rarity: (item as Medal).rarity || 'common',
      requirement: item.requirement,
      xpReward: (item as Achievement).xpReward || 100,
      isHidden: (item as Achievement).isHidden || false,
    });
    setIsCreating(true);
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      icon: '',
      category: 'combat',
      tier: 'bronze',
      rarity: 'common',
      requirement: { type: 'kills', value: 1 },
      xpReward: 100,
      isHidden: false,
    });
  };

  const requirementTypes = [
    { value: 'kills', label: 'Kills' },
    { value: 'deaths', label: 'Deaths' },
    { value: 'assists', label: 'Assists' },
    { value: 'headshots', label: 'Headshots' },
    { value: 'gamesPlayed', label: 'Games Played' },
    { value: 'gamesWon', label: 'Games Won' },
    { value: 'pointsCaptured', label: 'Points Captured' },
    { value: 'pointsDefended', label: 'Points Defended' },
    { value: 'suppliesDelivered', label: 'Supplies Delivered' },
    { value: 'vehiclesDestroyed', label: 'Vehicles Destroyed' },
    { value: 'revives', label: 'Revives' },
    { value: 'level', label: 'Level' },
    { value: 'kdr', label: 'K/D Ratio' },
    { value: 'winRate', label: 'Win Rate' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">
          Progression System
        </h1>
        <p className="text-gray-400">
          Hantera medaljer och achievements för spelarna
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('medals')}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
            ${activeTab === 'medals'
              ? 'bg-primary-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }
          `}
        >
          <Trophy className="w-5 h-5" />
          Medaljer ({medals?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
            ${activeTab === 'achievements'
              ? 'bg-primary-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }
          `}
        >
          <Award className="w-5 h-5" />
          Achievements ({achievements?.length || 0})
        </button>
      </div>

      {/* Create Button */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Skapa {activeTab === 'medals' ? 'Medalj' : 'Achievement'}
        </button>
      )}

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold">
              {editingItem ? 'Redigera' : 'Skapa'} {activeTab === 'medals' ? 'Medalj' : 'Achievement'}
            </h2>
            <button
              onClick={resetForm}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Namn</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                placeholder="t.ex. Första Blodet"
              />
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium mb-2">Ikon (emoji)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="input w-full"
                placeholder="🎯"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Beskrivning</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input w-full"
                rows={3}
                placeholder="Beskrivning..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input w-full"
              >
                <option value="combat">Combat</option>
                <option value="objective">Objective</option>
                <option value="support">Support</option>
                <option value="special">Special</option>
              </select>
            </div>

            {/* Tier (Medals only) */}
            {activeTab === 'medals' && (
              <div>
                <label className="block text-sm font-medium mb-2">Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  className="input w-full"
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
            )}

            {/* Rarity (Medals only) */}
            {activeTab === 'medals' && (
              <div>
                <label className="block text-sm font-medium mb-2">Raritet</label>
                <select
                  value={formData.rarity}
                  onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                  className="input w-full"
                >
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
            )}

            {/* XP Reward (Achievements only) */}
            {activeTab === 'achievements' && (
              <div>
                <label className="block text-sm font-medium mb-2">XP Reward</label>
                <input
                  type="number"
                  value={formData.xpReward}
                  onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) })}
                  className="input w-full"
                  min={0}
                />
              </div>
            )}

            {/* Is Hidden (Achievements only) */}
            {activeTab === 'achievements' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isHidden"
                  checked={formData.isHidden}
                  onChange={(e) => setFormData({ ...formData, isHidden: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isHidden" className="text-sm font-medium">
                  Gömd achievement
                </label>
              </div>
            )}

            {/* Requirement Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Kravtyp</label>
              <select
                value={formData.requirement.type}
                onChange={(e) => setFormData({
                  ...formData,
                  requirement: { ...formData.requirement, type: e.target.value }
                })}
                className="input w-full"
              >
                {requirementTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Requirement Value */}
            <div>
              <label className="block text-sm font-medium mb-2">Kravvärde</label>
              <input
                type="number"
                value={formData.requirement.value}
                onChange={(e) => setFormData({
                  ...formData,
                  requirement: { ...formData.requirement, value: parseInt(e.target.value) }
                })}
                className="input w-full"
                min={1}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={editingItem ? handleUpdate : handleCreate}
              className="btn-primary"
              disabled={createMedal.isPending || updateMedal.isPending || createAchievement.isPending || updateAchievement.isPending}
            >
              <Save className="w-5 h-5" />
              {editingItem ? 'Uppdatera' : 'Skapa'}
            </button>
            <button
              onClick={resetForm}
              className="btn-secondary"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold mb-6">
          {activeTab === 'medals' ? 'Medaljer' : 'Achievements'}
        </h2>

        {(activeTab === 'medals' ? medalsLoading : achievementsLoading) ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {activeTab === 'medals' ? (
              medals && medals.length > 0 ? (
                medals.map((medal) => (
                  <div
                    key={medal.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/50 transition-all"
                  >
                    <div className="text-4xl">{medal.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{medal.name}</h3>
                      <p className="text-sm text-gray-400">{medal.description}</p>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="px-2 py-1 rounded bg-white/10 capitalize">
                          {medal.category}
                        </span>
                        <span className={`px-2 py-1 rounded ${
                          medal.tier === 'platinum' ? 'bg-cyan-500/20 text-cyan-400' :
                          medal.tier === 'gold' ? 'bg-yellow-500/20 text-yellow-400' :
                          medal.tier === 'silver' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-amber-700/20 text-amber-600'
                        }`}>
                          {medal.tier}
                        </span>
                        <span className={`px-2 py-1 rounded ${
                          medal.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                          medal.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                          medal.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {medal.rarity}
                        </span>
                        <span className="px-2 py-1 rounded bg-white/10">
                          {(medal.requirement as any).type}: {(medal.requirement as any).value}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(medal)}
                        className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(medal.id)}
                        className="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  Inga medaljer än. Skapa den första!
                </div>
              )
            ) : (
              achievements && achievements.length > 0 ? (
                achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/50 transition-all"
                  >
                    <div className="text-4xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {achievement.name}
                        {achievement.isHidden && (
                          <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                            Gömd
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-400">{achievement.description}</p>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="px-2 py-1 rounded bg-white/10 capitalize">
                          {achievement.category}
                        </span>
                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-400">
                          +{achievement.xpReward} XP
                        </span>
                        <span className="px-2 py-1 rounded bg-white/10">
                          {(achievement.requirement as any).type}: {(achievement.requirement as any).value}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(achievement)}
                        className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(achievement.id)}
                        className="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  Inga achievements än. Skapa den första!
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
