import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedMedals() {
  console.log('🏅 Seeding medals...');

  const medals = [
    // ============================================
    // COMBAT MEDALS - Bronze
    // ============================================
    {
      name: 'Första Blodet',
      description: 'Få ditt första kill i en match',
      category: 'combat',
      tier: 'bronze',
      icon: '🎯',
      rarity: 'common',
      requirement: { type: 'kills', value: 1 },
    },
    {
      name: 'Marskalk',
      description: 'Få 10 kills',
      category: 'combat',
      tier: 'bronze',
      icon: '⚔️',
      rarity: 'common',
      requirement: { type: 'kills', value: 10 },
    },
    {
      name: 'Prickskjutare',
      description: 'Få 5 headshots',
      category: 'combat',
      tier: 'bronze',
      icon: '🎯',
      rarity: 'common',
      requirement: { type: 'headshots', value: 5 },
    },

    // ============================================
    // COMBAT MEDALS - Silver
    // ============================================
    {
      name: 'Veteran',
      description: 'Få 100 kills',
      category: 'combat',
      tier: 'silver',
      icon: '🔫',
      rarity: 'rare',
      requirement: { type: 'kills', value: 100 },
    },
    {
      name: 'Skarp Skytt',
      description: 'Få 50 headshots',
      category: 'combat',
      tier: 'silver',
      icon: '🎖️',
      rarity: 'rare',
      requirement: { type: 'headshots', value: 50 },
    },
    {
      name: 'Lagspelare',
      description: 'Få 50 assists',
      category: 'combat',
      tier: 'silver',
      icon: '🤝',
      rarity: 'rare',
      requirement: { type: 'assists', value: 50 },
    },

    // ============================================
    // COMBAT MEDALS - Gold
    // ============================================
    {
      name: 'Elite Soldat',
      description: 'Få 500 kills',
      category: 'combat',
      tier: 'gold',
      icon: '⭐',
      rarity: 'epic',
      requirement: { type: 'kills', value: 500 },
    },
    {
      name: 'Huvudjägare',
      description: 'Få 200 headshots',
      category: 'combat',
      tier: 'gold',
      icon: '💀',
      rarity: 'epic',
      requirement: { type: 'headshots', value: 200 },
    },
    {
      name: 'K/D Mästare',
      description: 'Uppnå 3.0 K/D ratio',
      category: 'combat',
      tier: 'gold',
      icon: '📊',
      rarity: 'epic',
      requirement: { type: 'kdr', value: 3 },
    },

    // ============================================
    // COMBAT MEDALS - Platinum
    // ============================================
    {
      name: 'Legendarisk Krigare',
      description: 'Få 1000 kills',
      category: 'combat',
      tier: 'platinum',
      icon: '👑',
      rarity: 'legendary',
      requirement: { type: 'kills', value: 1000 },
    },
    {
      name: 'Oövervinnlig',
      description: 'Uppnå 5.0 K/D ratio',
      category: 'combat',
      tier: 'platinum',
      icon: '💎',
      rarity: 'legendary',
      requirement: { type: 'kdr', value: 5 },
    },

    // ============================================
    // OBJECTIVE MEDALS - Bronze
    // ============================================
    {
      name: 'Invasor',
      description: 'Capture din första punkt',
      category: 'objective',
      tier: 'bronze',
      icon: '🏁',
      rarity: 'common',
      requirement: { type: 'pointsCaptured', value: 1 },
    },
    {
      name: 'Försvarare',
      description: 'Försvara din första punkt',
      category: 'objective',
      tier: 'bronze',
      icon: '🛡️',
      rarity: 'common',
      requirement: { type: 'pointsDefended', value: 1 },
    },

    // ============================================
    // OBJECTIVE MEDALS - Silver
    // ============================================
    {
      name: 'Punktkapare',
      description: 'Capture 25 punkter',
      category: 'objective',
      tier: 'silver',
      icon: '📍',
      rarity: 'rare',
      requirement: { type: 'pointsCaptured', value: 25 },
    },
    {
      name: 'Vakthund',
      description: 'Försvara 25 punkter',
      category: 'objective',
      tier: 'silver',
      icon: '🔰',
      rarity: 'rare',
      requirement: { type: 'pointsDefended', value: 25 },
    },

    // ============================================
    // OBJECTIVE MEDALS - Gold
    // ============================================
    {
      name: 'Erobrare',
      description: 'Capture 100 punkter',
      category: 'objective',
      tier: 'gold',
      icon: '🚩',
      rarity: 'epic',
      requirement: { type: 'pointsCaptured', value: 100 },
    },
    {
      name: 'Väktare',
      description: 'Försvara 100 punkter',
      category: 'objective',
      tier: 'gold',
      icon: '🏰',
      rarity: 'epic',
      requirement: { type: 'pointsDefended', value: 100 },
    },

    // ============================================
    // OBJECTIVE MEDALS - Platinum
    // ============================================
    {
      name: 'Territorie Herre',
      description: 'Capture 250 punkter',
      category: 'objective',
      tier: 'platinum',
      icon: '👑',
      rarity: 'legendary',
      requirement: { type: 'pointsCaptured', value: 250 },
    },

    // ============================================
    // SUPPORT MEDALS - Bronze
    // ============================================
    {
      name: 'Sjukvårdare',
      description: 'Återuppliva 5 lagkamrater',
      category: 'support',
      tier: 'bronze',
      icon: '💊',
      rarity: 'common',
      requirement: { type: 'revives', value: 5 },
    },
    {
      name: 'Försörjare',
      description: 'Leverera 25 supplies',
      category: 'support',
      tier: 'bronze',
      icon: '📦',
      rarity: 'common',
      requirement: { type: 'suppliesDelivered', value: 25 },
    },

    // ============================================
    // SUPPORT MEDALS - Silver
    // ============================================
    {
      name: 'Livräddare',
      description: 'Återuppliva 50 lagkamrater',
      category: 'support',
      tier: 'silver',
      icon: '⚕️',
      rarity: 'rare',
      requirement: { type: 'revives', value: 50 },
    },
    {
      name: 'Supply Master',
      description: 'Leverera 100 supplies',
      category: 'support',
      tier: 'silver',
      icon: '🚛',
      rarity: 'rare',
      requirement: { type: 'suppliesDelivered', value: 100 },
    },

    // ============================================
    // SUPPORT MEDALS - Gold
    // ============================================
    {
      name: 'Angel of Mercy',
      description: 'Återuppliva 200 lagkamrater',
      category: 'support',
      tier: 'gold',
      icon: '👼',
      rarity: 'epic',
      requirement: { type: 'revives', value: 200 },
    },
    {
      name: 'Logistics Expert',
      description: 'Leverera 500 supplies',
      category: 'support',
      tier: 'gold',
      icon: '🏭',
      rarity: 'epic',
      requirement: { type: 'suppliesDelivered', value: 500 },
    },

    // ============================================
    // SUPPORT MEDALS - Platinum
    // ============================================
    {
      name: 'Guardian Angel',
      description: 'Återuppliva 500 lagkamrater',
      category: 'support',
      tier: 'platinum',
      icon: '😇',
      rarity: 'legendary',
      requirement: { type: 'revives', value: 500 },
    },

    // ============================================
    // SPECIAL MEDALS - Bronze
    // ============================================
    {
      name: 'Rookie',
      description: 'Spela din första match',
      category: 'special',
      tier: 'bronze',
      icon: '🎮',
      rarity: 'common',
      requirement: { type: 'gamesPlayed', value: 1 },
    },
    {
      name: 'Vinnare',
      description: 'Vinn din första match',
      category: 'special',
      tier: 'bronze',
      icon: '🏆',
      rarity: 'common',
      requirement: { type: 'gamesWon', value: 1 },
    },

    // ============================================
    // SPECIAL MEDALS - Silver
    // ============================================
    {
      name: 'Dedikerad',
      description: 'Spela 50 matcher',
      category: 'special',
      tier: 'silver',
      icon: '🎯',
      rarity: 'rare',
      requirement: { type: 'gamesPlayed', value: 50 },
    },
    {
      name: 'Champion',
      description: 'Vinn 25 matcher',
      category: 'special',
      tier: 'silver',
      icon: '🥈',
      rarity: 'rare',
      requirement: { type: 'gamesWon', value: 25 },
    },
    {
      name: 'Nivå 10',
      description: 'Nå level 10',
      category: 'special',
      tier: 'silver',
      icon: '⬆️',
      rarity: 'rare',
      requirement: { type: 'level', value: 10 },
    },

    // ============================================
    // SPECIAL MEDALS - Gold
    // ============================================
    {
      name: 'Hardcore Gamer',
      description: 'Spela 200 matcher',
      category: 'special',
      tier: 'gold',
      icon: '🎮',
      rarity: 'epic',
      requirement: { type: 'gamesPlayed', value: 200 },
    },
    {
      name: 'Master',
      description: 'Vinn 100 matcher',
      category: 'special',
      tier: 'gold',
      icon: '🥇',
      rarity: 'epic',
      requirement: { type: 'gamesWon', value: 100 },
    },
    {
      name: 'Nivå 25',
      description: 'Nå level 25',
      category: 'special',
      tier: 'gold',
      icon: '🌟',
      rarity: 'epic',
      requirement: { type: 'level', value: 25 },
    },
    {
      name: 'Vinstserie',
      description: 'Uppnå 80% win rate',
      category: 'special',
      tier: 'gold',
      icon: '🔥',
      rarity: 'epic',
      requirement: { type: 'winRate', value: 80 },
    },

    // ============================================
    // SPECIAL MEDALS - Platinum
    // ============================================
    {
      name: 'Legendarisk Spelare',
      description: 'Spela 500 matcher',
      category: 'special',
      tier: 'platinum',
      icon: '💎',
      rarity: 'legendary',
      requirement: { type: 'gamesPlayed', value: 500 },
    },
    {
      name: 'Grandmaster',
      description: 'Vinn 250 matcher',
      category: 'special',
      tier: 'platinum',
      icon: '👑',
      rarity: 'legendary',
      requirement: { type: 'gamesWon', value: 250 },
    },
    {
      name: 'Nivå 50',
      description: 'Nå level 50',
      category: 'special',
      tier: 'platinum',
      icon: '⭐',
      rarity: 'legendary',
      requirement: { type: 'level', value: 50 },
    },
  ];

  for (const medal of medals) {
    await prisma.medal.upsert({
      where: { name: medal.name },
      update: medal,
      create: medal,
    });
  }

  console.log(`✅ Seeded ${medals.length} medals`);
}
