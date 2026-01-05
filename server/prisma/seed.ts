// ============================================
// Database Seed Script
// ============================================

import { PrismaClient } from '@prisma/client';
import { seedMedals } from './seeds/medals';
import { seedAchievements } from './seeds/achievements';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default permissions
  const permissions = [
    // Admin
    { key: 'admin.access', name: 'Admin Access', description: 'Access to admin panel', category: 'admin' },
    { key: 'admin.dashboard', name: 'View Dashboard', description: 'View admin dashboard', category: 'admin' },
    { key: 'admin.settings', name: 'Site Settings', description: 'Edit site settings', category: 'admin' },
    
    // Users
    { key: 'users.view', name: 'View Users', description: 'View user list', category: 'users' },
    { key: 'users.edit', name: 'Edit Users', description: 'Edit user profiles', category: 'users' },
    { key: 'users.delete', name: 'Delete Users', description: 'Delete users', category: 'users' },
    { key: 'users.ban', name: 'Ban Users', description: 'Ban/unban users', category: 'users' },
    
    // Roles
    { key: 'roles.view', name: 'View Roles', description: 'View role list', category: 'roles' },
    { key: 'roles.create', name: 'Create Roles', description: 'Create new roles', category: 'roles' },
    { key: 'roles.edit', name: 'Edit Roles', description: 'Edit roles', category: 'roles' },
    { key: 'roles.delete', name: 'Delete Roles', description: 'Delete roles', category: 'roles' },
    { key: 'roles.assign', name: 'Assign Roles', description: 'Assign roles to users', category: 'roles' },
    
    // Content
    { key: 'content.news.view', name: 'View News', description: 'View news articles', category: 'content' },
    { key: 'content.news.create', name: 'Create News', description: 'Create news articles', category: 'content' },
    { key: 'content.news.edit', name: 'Edit News', description: 'Edit news articles', category: 'content' },
    { key: 'content.news.delete', name: 'Delete News', description: 'Delete news articles', category: 'content' },
    { key: 'content.pages.view', name: 'View Pages', description: 'View pages', category: 'content' },
    { key: 'content.pages.create', name: 'Create Pages', description: 'Create pages', category: 'content' },
    { key: 'content.pages.edit', name: 'Edit Pages', description: 'Edit pages', category: 'content' },
    { key: 'content.pages.delete', name: 'Delete Pages', description: 'Delete pages', category: 'content' },
    { key: 'content.events.view', name: 'View Events', description: 'View events', category: 'content' },
    { key: 'content.events.create', name: 'Create Events', description: 'Create events', category: 'content' },
    { key: 'content.events.edit', name: 'Edit Events', description: 'Edit events', category: 'content' },
    { key: 'content.events.delete', name: 'Delete Events', description: 'Delete events', category: 'content' },
    { key: 'content.gallery.view', name: 'View Gallery', description: 'View gallery', category: 'content' },
    { key: 'content.gallery.create', name: 'Upload to Gallery', description: 'Upload to gallery', category: 'content' },
    { key: 'content.gallery.delete', name: 'Delete from Gallery', description: 'Delete gallery items', category: 'content' },
    
    // Server
    { key: 'server.view', name: 'View Server', description: 'View server status', category: 'server' },
    { key: 'server.start', name: 'Start Server', description: 'Start the game server', category: 'server' },
    { key: 'server.stop', name: 'Stop Server', description: 'Stop the game server', category: 'server' },
    { key: 'server.restart', name: 'Restart Server', description: 'Restart the game server', category: 'server' },
    { key: 'server.config', name: 'Server Config', description: 'Edit server configuration', category: 'server' },
    { key: 'server.mods', name: 'Manage Mods', description: 'Manage server mods', category: 'server' },
    { key: 'server.logs', name: 'View Logs', description: 'View server logs', category: 'server' },
    { key: 'server.players', name: 'Manage Players', description: 'Manage players on server', category: 'server' },
    
    // Moderation
    { key: 'moderation.kick', name: 'Kick Players', description: 'Kick players from server', category: 'moderation' },
    { key: 'moderation.ban', name: 'Ban Players', description: 'Ban players from server', category: 'moderation' },
    { key: 'moderation.mute', name: 'Mute Players', description: 'Mute players', category: 'moderation' },
    { key: 'moderation.whitelist', name: 'Manage Whitelist', description: 'Manage server whitelist', category: 'moderation' },
    
    // Tickets
    { key: 'tickets.view', name: 'View Tickets', description: 'View support tickets', category: 'tickets' },
    { key: 'tickets.respond', name: 'Respond to Tickets', description: 'Respond to tickets', category: 'tickets' },
    { key: 'tickets.assign', name: 'Assign Tickets', description: 'Assign tickets to staff', category: 'tickets' },
    { key: 'tickets.close', name: 'Close Tickets', description: 'Close tickets', category: 'tickets' },
    
    // Clans
    { key: 'clans.manage', name: 'Manage Clans', description: 'Manage all clans', category: 'clans' },
    { key: 'clans.delete', name: 'Delete Clans', description: 'Delete clans', category: 'clans' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: permission,
      create: permission,
    });
  }
  console.log('✅ Permissions created');

  // Create default roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      color: '#ef4444',
      icon: 'shield',
      priority: 100,
      isDefault: false,
    },
  });

  const moderatorRole = await prisma.role.upsert({
    where: { name: 'Moderator' },
    update: {},
    create: {
      name: 'Moderator',
      color: '#f59e0b',
      icon: 'badge',
      priority: 50,
      isDefault: false,
    },
  });

  const memberRole = await prisma.role.upsert({
    where: { name: 'Member' },
    update: {},
    create: {
      name: 'Member',
      color: '#6366f1',
      icon: 'user',
      priority: 0,
      isDefault: true,
    },
  });
  console.log('✅ Roles created');

  // Assign all permissions to Admin role
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log('✅ Admin permissions assigned');

  // Assign moderation permissions to Moderator role
  const modPermissions = allPermissions.filter(p => 
    p.category === 'moderation' || 
    p.key === 'tickets.view' ||
    p.key === 'tickets.respond' ||
    p.key === 'server.view' ||
    p.key === 'server.logs'
  );
  for (const permission of modPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: moderatorRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: moderatorRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log('✅ Moderator permissions assigned');

  // Create default site settings
  await prisma.siteSettings.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      siteName: 'Sweden Vikings',
      siteDescription: 'Arma Reforger Gaming Community',
      primaryColor: '#6366f1',
      accentColor: '#06b6d4',
    },
  });
  console.log('✅ Site settings created');

  // Create default navigation items
  const navItems = [
    { label: 'Hem', url: '/', icon: 'home', order: 0 },
    { label: 'Nyheter', url: '/news', icon: 'newspaper', order: 1 },
    { label: 'Events', url: '/events', icon: 'calendar', order: 2 },
    { label: 'Regler', url: '/rules', icon: 'book', order: 3 },
    { label: 'Gallery', url: '/gallery', icon: 'image', order: 4 },
    { label: 'Clans', url: '/clans', icon: 'users', order: 5 },
  ];

  for (const item of navItems) {
    await prisma.navItem.upsert({
      where: { id: item.label.toLowerCase() },
      update: item,
      create: { id: item.label.toLowerCase(), ...item },
    });
  }
  console.log('✅ Navigation items created');

  // Create default rules
  const rules = [
    { 
      title: 'Respektera andra spelare', 
      content: 'Alla spelare ska behandlas med respekt. Kränkningar, rasism, sexism eller annan diskriminering tolereras inte.',
      category: 'general',
      order: 1
    },
    { 
      title: 'Ingen fuskning', 
      content: 'Användning av hacks, exploits eller andra fuskmetoder är strängt förbjudet och leder till permanent ban.',
      category: 'general',
      order: 2
    },
    { 
      title: 'Följ rollspelsregler', 
      content: 'På vår server spelar vi med realism i fokus. Följ de rollspelsregler som gäller för respektive scenario.',
      category: 'gameplay',
      order: 3
    },
    { 
      title: 'Kommunicera på svenska eller engelska', 
      content: 'All kommunikation ska ske på svenska eller engelska för att alla ska kunna förstå.',
      category: 'communication',
      order: 4
    },
  ];

  for (const rule of rules) {
    await prisma.rule.upsert({
      where: { id: rule.title.toLowerCase().replace(/\s+/g, '-') },
      update: rule,
      create: { id: rule.title.toLowerCase().replace(/\s+/g, '-'), ...rule },
    });
  }
  console.log('✅ Rules created');

  // Create application questions
  const applicationQuestions = [
    { type: 'admin', question: 'Varför vill du bli admin?', order: 1 },
    { type: 'admin', question: 'Beskriv din tidigare erfarenhet av serveradministration', order: 2 },
    { type: 'admin', question: 'Hur mycket tid kan du lägga på servern per vecka?', order: 3 },
    { type: 'admin', question: 'Hur gammal är du?', order: 4 },
    { type: 'moderator', question: 'Varför vill du bli moderator?', order: 1 },
    { type: 'moderator', question: 'Hur skulle du hantera en konfliktsituation mellan spelare?', order: 2 },
    { type: 'moderator', question: 'Hur gammal är du?', order: 3 },
    { type: 'whitelist', question: 'Vad är ditt Steam-namn?', order: 1 },
    { type: 'whitelist', question: 'Varför vill du spela på vår server?', order: 2 },
    { type: 'whitelist', question: 'Har du läst och accepterar du våra regler?', order: 3 },
  ];

  for (const question of applicationQuestions) {
    await prisma.applicationQuestion.create({
      data: question,
    });
  }
  console.log('✅ Application questions created');

  // Seed medals and achievements
  await seedMedals();
  await seedAchievements();

  // Seed vanilla scenarios
  const vanillaScenarios = [
    { scenarioId: '{ECC61978EDCC2B5A}Missions/23_Campaign.conf', name: 'Campaign', description: 'Official Campaign scenario' },
    { scenarioId: '{59AD59368755F41A}Missions/21_GM_Eden.conf', name: 'Game Master - Eden', description: 'Game Master mode on Eden map' },
    { scenarioId: '{90F086877C27B6F6}Missions/17_Conflict.conf', name: 'Conflict - Everon', description: 'Conflict mode on Everon map' },
    { scenarioId: '{ECC61978EDCC2B5A}Missions/20_Conflict_Arland.conf', name: 'Conflict - Arland', description: 'Conflict mode on Arland map' },
    { scenarioId: '{59AD59368755F41A}Missions/21_GM_Arland.conf', name: 'Game Master - Arland', description: 'Game Master mode on Arland map' },
    { scenarioId: '{90F086877C27B6F6}Missions/17_Combat_Ops.conf', name: 'Combat Operations', description: 'Combat Operations scenario' },
  ];

  for (const scenario of vanillaScenarios) {
    await prisma.scenario.upsert({
      where: { scenarioId: scenario.scenarioId },
      update: { name: scenario.name, description: scenario.description },
      create: {
        scenarioId: scenario.scenarioId,
        name: scenario.name,
        description: scenario.description,
        isVanilla: true,
      },
    });
  }
  console.log('✅ Vanilla scenarios created');

  console.log('');
  console.log('🎉 Database seed completed successfully!');
  console.log('');
  console.log('Default roles created:');
  console.log('  - Admin (all permissions)');
  console.log('  - Moderator (moderation permissions)');
  console.log('  - Member (default role)');
  console.log('');
  console.log('Game progression:');
  console.log('  - 43 Medals created');
  console.log('  - 48 Achievements created');
  console.log('');
  console.log('Server management:');
  console.log(`  - ${vanillaScenarios.length} Vanilla scenarios created`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

