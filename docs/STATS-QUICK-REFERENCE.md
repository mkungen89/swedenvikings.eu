# Stats System - Quick Reference Card

## Common Operations

### Record a Match
```typescript
import { statsTracker } from '@/services/statsTracker';

await statsTracker.recordMatch({
  userId: 'user-123',
  map: 'Everon',
  gameMode: 'Conflict',
  duration: 3600, // seconds
  result: 'win', // 'win' | 'loss' | 'draw'
  kills: 15,
  deaths: 5,
  assists: 8,
  score: 2500,
  pointsCaptured: 3,
  pointsDefended: 2,
  suppliesDelivered: 10,
  revives: 5,
  headshots: 3,
  vehiclesDestroyed: 2,
  distanceTraveled: 5.2 // km
});
```

### Check Achievements
```typescript
import { achievementsService } from '@/services/achievements.service';

const result = await achievementsService.checkAchievements('user-123');
console.log(`Unlocked: ${result.newlyCompleted.length} achievements`);
console.log(`Updated: ${result.updated} achievements`);
```

### Check Medals
```typescript
import { medalsService } from '@/services/medals.service';

const result = await medalsService.checkMedals('user-123');
console.log(`Unlocked: ${result.newlyUnlocked.length} medals`);
console.log(`Updated: ${result.updated} medals`);
```

### Get Leaderboard
```typescript
import { statsTracker } from '@/services/statsTracker';

const topPlayers = await statsTracker.getLeaderboard('kills', 10);
```

## Frontend Hooks

### Fetch Player Stats
```typescript
import { usePlayerStats } from '@/hooks/useStats';

const { data: stats, isLoading } = usePlayerStats(userId);
```

### Fetch Achievements
```typescript
import { useUserAchievements } from '@/hooks/useAchievements';

const { data: achievements } = useUserAchievements(userId);
```

### Fetch Medals
```typescript
import { useUserMedals } from '@/hooks/useMedals';

const { data: medals } = useUserMedals(userId);
```

### Record Match (Frontend)
```typescript
import { useRecordMatch } from '@/hooks/useStats';

const recordMatch = useRecordMatch();

await recordMatch.mutateAsync({
  userId: 'user-123',
  map: 'Everon',
  gameMode: 'Conflict',
  duration: 3600,
  result: 'win',
  kills: 15,
  deaths: 5
});
```

## API Endpoints

### Stats
```
GET    /api/stats/:userId
GET    /api/stats/:userId/matches?limit=10&offset=0
POST   /api/stats/:userId/matches
GET    /api/stats/leaderboard/:type?limit=10
```

### Achievements
```
GET    /api/achievements?category=kills&includeHidden=false
GET    /api/achievements/user/:userId
POST   /api/achievements (Admin)
PUT    /api/achievements/:id (Admin)
DELETE /api/achievements/:id (Admin)
POST   /api/achievements/check/:userId
```

### Medals
```
GET    /api/medals?category=combat&tier=gold&rarity=epic
GET    /api/medals/user/:userId
POST   /api/medals (Admin)
PUT    /api/medals/:id (Admin)
DELETE /api/medals/:id (Admin)
POST   /api/medals/check/:userId
```

## XP Calculation

```
Base XP: 100
Kills: kills × 10
Assists: assists × 5
Point Captures: captures × 50
Point Defense: defenses × 30
Supplies: supplies × 3
Revives: revives × 15
Deaths: deaths × -3
Win Bonus: 200
Score Bonus: (score / 100) × 10
```

## Level Formula

```
Level = floor(sqrt(XP / 1000)) + 1

Level 1:  0 XP
Level 2:  1,000 XP
Level 5:  16,000 XP
Level 10: 81,000 XP
Level 25: 576,000 XP
Level 50: 2,401,000 XP
```

## Achievement Categories

- **kills** - Combat achievements
- **objectives** - Capture/defense achievements
- **teamwork** - Support achievements
- **special** - Unique achievements

## Medal Tiers & Rarity

**Tiers**: bronze | silver | gold | platinum
**Rarity**: common | rare | epic | legendary

## Requirement Types

```typescript
type RequirementType =
  | 'kills'
  | 'deaths'
  | 'assists'
  | 'headshots'
  | 'gamesPlayed'
  | 'gamesWon'
  | 'pointsCaptured'
  | 'pointsDefended'
  | 'suppliesDelivered'
  | 'revives'
  | 'vehiclesDestroyed'
  | 'level'
  | 'kdr'
  | 'winRate';
```

## Admin Operations

### Manually Award Achievement
```typescript
import { achievementsService } from '@/services/achievements.service';

await achievementsService.awardAchievement(
  'user-123',
  'achievement-id'
);
```

### Manually Award Medal
```typescript
import { medalsService } from '@/services/medals.service';

await medalsService.awardMedal(
  'user-123',
  'medal-id'
);
```

### Reset User Stats
```typescript
await achievementsService.resetUserAchievements('user-123');
await medalsService.resetUserMedals('user-123');
```

### Create Achievement
```typescript
await achievementsService.createAchievement({
  name: 'Tank Destroyer',
  description: 'Destroy 50 vehicles',
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

### Create Medal
```typescript
await medalsService.createMedal({
  name: 'Veteran Tanker',
  description: 'Destroy 100 vehicles',
  category: 'combat',
  tier: 'gold',
  icon: '🎖️',
  rarity: 'epic',
  requirement: {
    type: 'vehiclesDestroyed',
    value: 100
  }
});
```

## Database Queries

### Get Top 10 by Kills
```typescript
const top = await prisma.playerStats.findMany({
  orderBy: { kills: 'desc' },
  take: 10,
  include: {
    user: {
      select: { id: true, username: true, avatar: true }
    }
  }
});
```

### Get User's Unlocked Achievements
```typescript
const unlocked = await prisma.userAchievement.findMany({
  where: {
    userId: 'user-123',
    isCompleted: true
  },
  include: { achievement: true }
});
```

### Get User's Medals by Tier
```typescript
const goldMedals = await prisma.userMedal.findMany({
  where: {
    userId: 'user-123',
    isUnlocked: true,
    medal: { tier: 'gold' }
  },
  include: { medal: true }
});
```

## Notification Types

- `achievement_unlocked` - Achievement completed
- `medal_unlocked` - Medal unlocked
- `level_up` - Level increased

## Useful Scripts

### Seed Database
```bash
npm run db:seed
```

### Open Prisma Studio
```bash
npm run db:studio
```

### View Logs
```bash
pm2 logs swedenvikings
```

### Restart Server
```bash
pm2 restart swedenvikings
```

---

**Quick Tip**: After recording matches, achievements and medals are checked automatically. No need to manually trigger checks unless testing!
