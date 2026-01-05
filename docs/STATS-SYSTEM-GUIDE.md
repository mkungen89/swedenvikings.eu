# Stats Tracking, Leaderboards & Achievements System - Implementation Guide

## Overview

The Sweden Vikings CMS now includes a complete stats tracking, leaderboards, medals, and achievements system for Arma Reforger gameplay. This document provides a comprehensive guide to the implementation.

## System Architecture

### Backend Services

#### 1. **Stats Tracker Service** (`server/src/services/statsTracker.ts`)

The core service that handles match recording and player statistics.

**Key Features:**
- Records match results and player performance
- Calculates derived stats (K/D ratio, win rate, accuracy)
- XP system with level progression
- Automatically triggers achievement and medal checks after each match
- Maintains leaderboard rankings

**Main Methods:**
```typescript
// Record a match
await statsTracker.recordMatch({
  userId: 'user-id',
  map: 'Everon',
  gameMode: 'Conflict',
  duration: 3600, // seconds
  result: 'win',
  kills: 15,
  deaths: 5,
  assists: 8,
  score: 2500,
  pointsCaptured: 3,
  pointsDefended: 2,
  suppliesDelivered: 10,
  revives: 5
});

// Get leaderboard
const topPlayers = await statsTracker.getLeaderboard('kills', 10);
```

**XP & Leveling System:**
- Base XP per match: 100
- XP from kills: 10 per kill
- XP from assists: 5 per assist
- XP from captures: 50 per point
- XP from defense: 30 per point
- XP from supplies: 3 per delivery
- XP from revives: 15 per revive
- Win bonus: 200 XP
- Death penalty: -3 XP per death

**Level Formula:**
```
Level = floor(sqrt(XP / 1000)) + 1

Examples:
Level 1: 0 XP
Level 2: 1,000 XP
Level 3: 4,000 XP
Level 5: 16,000 XP
Level 10: 81,000 XP
Level 25: 576,000 XP
Level 50: 2,401,000 XP
```

#### 2. **Achievements Service** (`server/src/services/achievements.service.ts`)

Manages achievement checking, awarding, and notifications.

**Key Features:**
- Automatic achievement progress tracking
- XP rewards for completed achievements
- Real-time notifications
- Admin tools for manual awarding
- Progress tracking for locked achievements

**Achievement Types:**
- **Kills**: First Blood, Century Club, Grim Reaper, Headshot Master
- **Objectives**: Point Capturer, Territory Master, Conqueror, Defender
- **Teamwork**: Medic, Combat Medic, Lifesaver, Supply Runner
- **Special**: Level milestones, K/D achievements, win rate achievements

**Total Achievements:** 40+

**Example Achievement:**
```json
{
  "name": "Grim Reaper",
  "description": "Få 1000 kills",
  "category": "kills",
  "icon": "💀",
  "requirement": {
    "type": "kills",
    "value": 1000
  },
  "xpReward": 2000,
  "isHidden": false
}
```

#### 3. **Medals Service** (`server/src/services/medals.service.ts`)

Manages medal system with tiers and rarity.

**Key Features:**
- Four tiers: Bronze, Silver, Gold, Platinum
- Four rarity levels: Common, Rare, Epic, Legendary
- Progress tracking
- Real-time unlock notifications
- Medal statistics tracking

**Medal Categories:**
- **Combat**: Kills, headshots, K/D ratio
- **Objective**: Captures, defense
- **Support**: Revives, supply delivery
- **Special**: Games played, wins, levels

**Total Medals:** 43

**Tier System:**
- Bronze: Entry-level medals (e.g., first kill, first capture)
- Silver: Moderate achievements (100 kills, 25 captures)
- Gold: Advanced achievements (500 kills, 100 captures)
- Platinum: Elite achievements (1000 kills, 250 captures)

**Rarity Distribution:**
- Common: Basic achievements, easy to obtain
- Rare: Requires dedication
- Epic: Significant accomplishment
- Legendary: Only the best players achieve these

### API Routes

#### Stats Routes (`/api/stats/*`)

```typescript
// Get player stats
GET /api/stats/:userId
Response: PlayerStats object

// Get match history
GET /api/stats/:userId/matches?limit=10&offset=0
Response: { matches: Match[], total: number }

// Record new match (Admin/System)
POST /api/stats/:userId/matches
Body: Match data
Response: { match: Match, stats: PlayerStats }

// Get leaderboard
GET /api/stats/leaderboard/:type?limit=10
Types: level, kills, kdr, winrate, xp
Response: PlayerStats[]
```

#### Achievements Routes (`/api/achievements/*`)

```typescript
// Get all achievements
GET /api/achievements?category=kills&includeHidden=false
Response: Achievement[]

// Get user's achievements with progress
GET /api/achievements/user/:userId
Response: UserAchievement[]

// Create achievement (Admin)
POST /api/achievements
Body: Achievement data
Response: Achievement

// Update achievement (Admin)
PUT /api/achievements/:id
Body: Partial achievement data
Response: Achievement

// Delete achievement (Admin)
DELETE /api/achievements/:id
Response: Success message

// Check achievement progress
POST /api/achievements/check/:userId
Response: { newlyCompleted: [], updated: number }
```

#### Medals Routes (`/api/medals/*`)

```typescript
// Get all medals
GET /api/medals?category=combat&tier=gold&rarity=epic
Response: Medal[]

// Get user's medals with progress
GET /api/medals/user/:userId
Response: UserMedal[]

// Create medal (Admin)
POST /api/medals
Body: Medal data
Response: Medal

// Update medal (Admin)
PUT /api/medals/:id
Body: Partial medal data
Response: Medal

// Delete medal (Admin)
DELETE /api/medals/:id
Response: Success message

// Check medal progress
POST /api/medals/check/:userId
Response: { newlyUnlocked: [], updated: number }
```

### Database Models

All models are defined in `server/prisma/schema.prisma`:

- **PlayerStats**: User statistics and rankings
- **Match**: Individual match records
- **Achievement**: Achievement definitions
- **UserAchievement**: User achievement progress
- **Medal**: Medal definitions
- **UserMedal**: User medal progress

### Seed Data

Initial achievements and medals are seeded via:
- `server/prisma/seeds/achievements.ts` - 40+ achievements
- `server/prisma/seeds/medals.ts` - 43 medals

Run seed with:
```bash
npm run db:seed
```

## Frontend Implementation

### Pages

#### 1. **Leaderboards** (`client/src/pages/Leaderboards.tsx`)

Features:
- Top players by kills, K/D ratio, level, playtime
- Filter by time period (all-time, monthly, weekly)
- Player cards with avatars and stats
- Responsive design with dark/light theme support
- Pagination

#### 2. **Profile Stats** (`client/src/pages/ProfileNew.tsx`)

Features:
- Player stats overview
- Recent matches list
- Achievement showcase
- Medal display
- Progress bars for locked achievements
- Level progression visualization

#### 3. **Admin - Progression Management** (`client/src/pages/admin/Progression.tsx`)

Features:
- Create/edit/delete achievements
- Create/edit/delete medals
- View all player stats
- Manually award achievements/medals
- Reset player stats (with confirmation)
- Bulk operations

### React Hooks

#### Stats Hooks (`client/src/hooks/useStats.ts`)

```typescript
// Get player stats
const { data: stats } = usePlayerStats(userId);

// Get match history
const { data: matches } = useMatchHistory(userId, { limit: 10 });

// Get leaderboard
const { data: leaderboard } = useLeaderboard('kills', 10);

// Record match
const recordMatch = useRecordMatch();
await recordMatch.mutateAsync({
  userId,
  map: 'Everon',
  gameMode: 'Conflict',
  duration: 3600,
  result: 'win',
  kills: 15,
  deaths: 5
});
```

#### Achievements Hooks (`client/src/hooks/useAchievements.ts`)

```typescript
// Get all achievements
const { data: achievements } = useAchievements();

// Get user's achievements
const { data: userAchievements } = useUserAchievements(userId);

// Create achievement (Admin)
const createAchievement = useCreateAchievement();
await createAchievement.mutateAsync(achievementData);

// Update achievement (Admin)
const updateAchievement = useUpdateAchievement();
await updateAchievement.mutateAsync({ id, ...data });

// Delete achievement (Admin)
const deleteAchievement = useDeleteAchievement();
await deleteAchievement.mutateAsync(id);

// Check progress
const checkAchievements = useCheckAchievements();
await checkAchievements.mutateAsync(userId);
```

#### Medals Hooks (`client/src/hooks/useMedals.ts`)

```typescript
// Get all medals
const { data: medals } = useMedals({ tier: 'gold' });

// Get user's medals
const { data: userMedals } = useUserMedals(userId);

// Create medal (Admin)
const createMedal = useCreateMedal();
await createMedal.mutateAsync(medalData);

// Update medal (Admin)
const updateMedal = useUpdateMedal();
await updateMedal.mutateAsync({ id, ...data });

// Delete medal (Admin)
const deleteMedal = useDeleteMedal();
await deleteMedal.mutateAsync(id);

// Check progress
const checkMedals = useCheckMedals();
await checkMedals.mutateAsync(userId);
```

## Notifications

The system automatically creates notifications for:
- **Achievement unlocked**: When a player completes an achievement
- **Medal unlocked**: When a player unlocks a medal
- **Level up**: When a player reaches a new level

Notifications are stored in the `Notification` table and can be fetched via existing notification routes.

## Internationalization

Translations are provided in:
- `client/src/i18n/locales/sv.json` (Swedish)
- `client/src/i18n/locales/en.json` (English)

Keys for stats system:
```json
{
  "stats": {
    "kills": "Kills",
    "deaths": "Deaths",
    "kdr": "K/D Ratio",
    "winRate": "Win Rate",
    "level": "Level",
    "xp": "Experience Points",
    "achievements": "Achievements",
    "medals": "Medals"
  },
  "achievements": {
    "unlocked": "Unlocked",
    "locked": "Locked",
    "progress": "Progress"
  },
  "medals": {
    "bronze": "Bronze",
    "silver": "Silver",
    "gold": "Gold",
    "platinum": "Platinum",
    "common": "Common",
    "rare": "Rare",
    "epic": "Epic",
    "legendary": "Legendary"
  }
}
```

## Usage Examples

### Recording a Match After Game Server Event

```typescript
import { statsTracker } from './services/statsTracker';

// Parse Arma Reforger server logs
// When match ends, extract player data and record match

async function onMatchEnd(matchData: any) {
  for (const player of matchData.players) {
    await statsTracker.recordMatch({
      userId: player.userId,
      map: matchData.map,
      gameMode: matchData.gameMode,
      duration: matchData.duration,
      result: player.team === matchData.winningTeam ? 'win' : 'loss',
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      score: player.score,
      pointsCaptured: player.captures,
      pointsDefended: player.defenses,
      suppliesDelivered: player.supplies,
      revives: player.revives,
      headshots: player.headshots,
      vehiclesDestroyed: player.vehicleKills,
      distanceTraveled: player.distance
    });
  }
}
```

### Manually Awarding Achievement (Admin)

```typescript
import { achievementsService } from './services/achievements.service';

// Award specific achievement to user
await achievementsService.awardAchievement(
  'user-id',
  'achievement-id'
);

// This will:
// 1. Mark achievement as completed
// 2. Award XP reward
// 3. Create notification
// 4. Check if level up occurred
```

### Creating Custom Achievement

```typescript
import { achievementsService } from './services/achievements.service';

const newAchievement = await achievementsService.createAchievement({
  name: 'Tank Destroyer',
  description: 'Destroy 50 enemy vehicles',
  category: 'special',
  icon: '🔥',
  requirement: {
    type: 'vehiclesDestroyed',
    value: 50
  },
  xpReward: 1000,
  isHidden: false
});
```

## Performance Considerations

1. **Leaderboard Caching**: Consider implementing Redis caching for leaderboards (currently queries database directly)
2. **Bulk Updates**: When processing multiple matches, use batch operations
3. **Indexing**: Database indexes are already set on frequently queried fields (level, XP, ranks)
4. **Async Processing**: Achievement/medal checks run asynchronously after match recording

## Security

- All admin endpoints require `requireAuth` and `requirePermission('manage_content')` middleware
- Match recording should be restricted to server system or admin users
- User stats are public but modification is protected

## Testing

### Manual Testing Checklist

1. **Stats Recording**:
   - [ ] Record a match
   - [ ] Verify stats updated correctly
   - [ ] Check K/D ratio calculation
   - [ ] Verify win rate calculation
   - [ ] Check XP award
   - [ ] Verify level calculation

2. **Achievements**:
   - [ ] Complete an achievement
   - [ ] Verify notification created
   - [ ] Check XP awarded
   - [ ] Verify progress tracking
   - [ ] Test hidden achievements

3. **Medals**:
   - [ ] Unlock a medal
   - [ ] Verify notification created
   - [ ] Check tier/rarity display
   - [ ] Verify progress tracking
   - [ ] Test medal statistics

4. **Leaderboards**:
   - [ ] View leaderboard by kills
   - [ ] View leaderboard by K/D
   - [ ] View leaderboard by level
   - [ ] Verify sorting
   - [ ] Test pagination

5. **Admin Functions**:
   - [ ] Create achievement
   - [ ] Edit achievement
   - [ ] Delete achievement
   - [ ] Award achievement manually
   - [ ] Reset user stats
   - [ ] Create medal
   - [ ] Award medal manually

## Future Enhancements

Potential improvements for future releases:

1. **Time-Based Leaderboards**: Weekly, monthly, seasonal leaderboards
2. **Clan Stats**: Aggregate stats for clans
3. **Streak Tracking**: Win streaks, kill streaks
4. **Match Replays**: Store detailed match data for analysis
5. **Advanced Stats**: Heat maps, weapon statistics, map-specific performance
6. **Seasonal Resets**: Reset stats at season start with legacy preservation
7. **Achievements Rework**: Chain achievements, secret achievements
8. **Badges**: Special badges for unique accomplishments
9. **Prestige System**: Reset level for prestige points and exclusive rewards
10. **Competition Mode**: Tournament tracking, ELO ratings

## Troubleshooting

### Stats Not Updating

1. Check if match is being recorded: Review server logs
2. Verify user exists in database
3. Check PlayerStats record exists (auto-created on first match)
4. Verify database connection

### Achievements Not Unlocking

1. Check achievement requirements match stat types
2. Verify user achievement records exist
3. Check notification creation didn't fail
4. Review achievement service logs

### Leaderboard Not Showing

1. Verify PlayerStats records exist
2. Check orderBy field exists in database
3. Verify API route is accessible
4. Check frontend API call

## Support

For issues or questions:
1. Check server logs: `pm2 logs swedenvikings`
2. Review Prisma Studio: `npm run db:studio`
3. Check browser console for frontend errors
4. Review API responses in Network tab

---

**Implementation Complete**: The stats tracking, leaderboards, and achievements system is fully implemented and ready for use!
