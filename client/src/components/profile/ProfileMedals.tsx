import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Trophy,
  Target,
  Heart,
  Zap,
  Shield,
  Star,
  Crown,
  Lock,
  X,
} from 'lucide-react';
import { useUserMedals } from '@/hooks/useMedals';
import type { UserMedal } from '@/hooks/useMedals';

interface ProfileMedalsProps {
  userId: string;
}

type MedalCategory = 'all' | 'combat' | 'objective' | 'support' | 'special';
type MedalTier = 'bronze' | 'silver' | 'gold' | 'platinum';
type MedalRarity = 'common' | 'rare' | 'epic' | 'legendary';

export default function ProfileMedals({ userId }: ProfileMedalsProps) {
  const [selectedCategory, setSelectedCategory] = useState<MedalCategory>('all');
  const [selectedMedal, setSelectedMedal] = useState<UserMedal | null>(null);

  const { data: userMedals, isLoading } = useUserMedals(userId);

  const categories = [
    { id: 'all' as MedalCategory, label: 'Alla', icon: <Trophy className="w-4 h-4" /> },
    { id: 'combat' as MedalCategory, label: 'Strid', icon: <Target className="w-4 h-4" /> },
    { id: 'objective' as MedalCategory, label: 'Mål', icon: <Award className="w-4 h-4" /> },
    { id: 'support' as MedalCategory, label: 'Support', icon: <Heart className="w-4 h-4" /> },
    { id: 'special' as MedalCategory, label: 'Special', icon: <Star className="w-4 h-4" /> },
  ];

  const tierColors: Record<MedalTier, string> = {
    bronze: 'from-amber-700 to-amber-900',
    silver: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-cyan-400 to-blue-600',
  };

  const rarityColors: Record<MedalRarity, string> = {
    common: 'border-gray-600',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-yellow-500',
  };

  const rarityGlow: Record<MedalRarity, string> = {
    common: '',
    rare: 'shadow-lg shadow-blue-500/20',
    epic: 'shadow-lg shadow-purple-500/30',
    legendary: 'shadow-xl shadow-yellow-500/50',
  };

  const filteredMedals = useMemo(() => {
    if (!userMedals) return [];
    if (selectedCategory === 'all') return userMedals;
    return userMedals.filter((um) => um.medal.category === selectedCategory);
  }, [userMedals, selectedCategory]);

  const unlockedCount = userMedals?.filter((m) => m.isUnlocked).length || 0;
  const totalCount = userMedals?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Mina Medaljer
          </h2>
          <div className="text-right">
            <div className="font-display text-3xl font-bold text-primary-400">
              {unlockedCount}/{totalCount}
            </div>
            <div className="text-sm text-gray-400">Upplåsta</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/5 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-yellow-500 transition-all duration-500"
            style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
          />
        </div>

        {/* Rarity Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {(['common', 'rare', 'epic', 'legendary'] as MedalRarity[]).map((rarity) => {
            const rarityMedals = userMedals?.filter((m) => m.medal.rarity === rarity) || [];
            const unlockedInRarity = rarityMedals.filter((m) => m.isUnlocked).length;

            return (
              <div key={rarity} className="text-center">
                <div className={`text-sm font-semibold capitalize ${
                  rarity === 'legendary' ? 'text-yellow-500' :
                  rarity === 'epic' ? 'text-purple-500' :
                  rarity === 'rare' ? 'text-blue-500' :
                  'text-gray-500'
                }`}>
                  {rarity === 'legendary' ? 'Legendarisk' :
                   rarity === 'epic' ? 'Episk' :
                   rarity === 'rare' ? 'Sällsynt' :
                   'Vanlig'}
                </div>
                <div className="text-xl font-bold mt-1">
                  {unlockedInRarity}/{rarityMedals.length}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
              ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }
            `}
          >
            {category.icon}
            {category.label}
          </button>
        ))}
      </div>

      {/* Medals Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredMedals.length > 0 ? (
          filteredMedals.map((userMedal) => (
            <motion.button
              key={userMedal.id}
              onClick={() => setSelectedMedal(userMedal)}
              className={`
                group relative card p-4 hover:scale-105 transition-all
                ${rarityColors[userMedal.medal.rarity as MedalRarity]}
                ${rarityGlow[userMedal.medal.rarity as MedalRarity]}
                ${!userMedal.isUnlocked ? 'opacity-60' : ''}
              `}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Medal Icon */}
              <div
                className={`
                  w-full aspect-square rounded-xl flex items-center justify-center text-5xl
                  bg-gradient-to-br ${tierColors[userMedal.medal.tier as MedalTier]}
                  mb-3
                `}
              >
                {userMedal.isUnlocked ? (
                  userMedal.medal.icon
                ) : (
                  <Lock className="w-8 h-8 text-white/50" />
                )}
              </div>

              {/* Medal Name */}
              <h3 className="font-semibold text-sm text-center mb-1 line-clamp-2">
                {userMedal.isUnlocked ? userMedal.medal.name : '???'}
              </h3>

              {/* Tier Badge */}
              <div className={`
                text-xs text-center capitalize
                ${userMedal.medal.tier === 'platinum' ? 'text-cyan-400' :
                  userMedal.medal.tier === 'gold' ? 'text-yellow-400' :
                  userMedal.medal.tier === 'silver' ? 'text-gray-400' :
                  'text-amber-600'}
              `}>
                {userMedal.medal.tier === 'platinum' ? 'Platina' :
                 userMedal.medal.tier === 'gold' ? 'Guld' :
                 userMedal.medal.tier === 'silver' ? 'Silver' :
                 'Brons'}
              </div>

              {/* Progress Bar for Locked Medals */}
              {!userMedal.isUnlocked && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Framsteg</span>
                    <span>
                      {userMedal.progress}/{userMedal.maxProgress}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300"
                      style={{ width: `${(userMedal.progress / userMedal.maxProgress) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Unlocked Badge */}
              {userMedal.isUnlocked && (
                <div className="absolute top-2 right-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                </div>
              )}
            </motion.button>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-400">
            Inga medaljer funna i denna kategori
          </div>
        )}
      </div>

      {/* Medal Detail Modal */}
      <AnimatePresence>
        {selectedMedal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMedal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`
                card max-w-lg w-full p-6 relative
                ${rarityColors[selectedMedal.medal.rarity as MedalRarity]}
                ${rarityGlow[selectedMedal.medal.rarity as MedalRarity]}
              `}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedMedal(null)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Medal Icon */}
              <div className="flex justify-center mb-6">
                <div
                  className={`
                    w-32 h-32 rounded-2xl flex items-center justify-center text-7xl
                    bg-gradient-to-br ${tierColors[selectedMedal.medal.tier as MedalTier]}
                  `}
                >
                  {selectedMedal.isUnlocked ? (
                    selectedMedal.medal.icon
                  ) : (
                    <Lock className="w-16 h-16 text-white/50" />
                  )}
                </div>
              </div>

              {/* Medal Info */}
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl font-bold mb-2">
                  {selectedMedal.isUnlocked ? selectedMedal.medal.name : 'Låst Medalj'}
                </h2>
                <p className="text-gray-400">
                  {selectedMedal.isUnlocked ? selectedMedal.medal.description : 'Lås upp denna medalj för att se detaljer'}
                </p>
              </div>

              {/* Tier & Rarity */}
              <div className="flex gap-4 justify-center mb-6">
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">Tier</div>
                  <div className={`
                    font-semibold capitalize
                    ${selectedMedal.medal.tier === 'platinum' ? 'text-cyan-400' :
                      selectedMedal.medal.tier === 'gold' ? 'text-yellow-400' :
                      selectedMedal.medal.tier === 'silver' ? 'text-gray-400' :
                      'text-amber-600'}
                  `}>
                    {selectedMedal.medal.tier === 'platinum' ? 'Platina' :
                     selectedMedal.medal.tier === 'gold' ? 'Guld' :
                     selectedMedal.medal.tier === 'silver' ? 'Silver' :
                     'Brons'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">Raritet</div>
                  <div className={`
                    font-semibold capitalize
                    ${selectedMedal.medal.rarity === 'legendary' ? 'text-yellow-500' :
                      selectedMedal.medal.rarity === 'epic' ? 'text-purple-500' :
                      selectedMedal.medal.rarity === 'rare' ? 'text-blue-500' :
                      'text-gray-500'}
                  `}>
                    {selectedMedal.medal.rarity === 'legendary' ? 'Legendarisk' :
                     selectedMedal.medal.rarity === 'epic' ? 'Episk' :
                     selectedMedal.medal.rarity === 'rare' ? 'Sällsynt' :
                     'Vanlig'}
                  </div>
                </div>
              </div>

              {/* Requirement */}
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <div className="text-xs text-gray-400 mb-2">Krav</div>
                <div className="font-medium">
                  {(selectedMedal.medal.requirement as any).type}: {(selectedMedal.medal.requirement as any).value}
                </div>
              </div>

              {/* Progress */}
              {!selectedMedal.isUnlocked ? (
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Framsteg</span>
                    <span className="font-semibold">
                      {selectedMedal.progress}/{selectedMedal.maxProgress}
                    </span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
                      style={{ width: `${(selectedMedal.progress / selectedMedal.maxProgress) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-2 text-center">
                    {Math.round((selectedMedal.progress / selectedMedal.maxProgress) * 100)}% klart
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/50 rounded-xl p-4 text-center">
                  <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="font-semibold text-green-400">Upplåst!</div>
                  {selectedMedal.unlockedAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(selectedMedal.unlockedAt).toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
