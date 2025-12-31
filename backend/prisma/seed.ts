import { PrismaClient } from '@prisma/client';
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// Sample data generators
const sampleNames = [
  'Alice Johnson',
  'Bob Smith',
  'Charlie Brown',
  'Diana Prince',
  'Ethan Hunt',
  'Fiona Apple',
  'George Washington',
  'Hannah Montana',
  'Isaac Newton',
  'Julia Roberts',
];

const sampleWorkspaceNames = [
  'Acme Corporation',
  'Tech Startup Inc',
  'Design Studio',
  'Marketing Agency',
  'Development Team',
  'Product Launch',
  'Research Lab',
  'Creative Collective',
];

const samplePageTitles = [
  'Getting Started',
  'Project Overview',
  'Meeting Notes',
  'Product Roadmap',
  'Team Handbook',
  'Design System',
  'API Documentation',
  'User Research',
  'Marketing Strategy',
  'Quarterly Goals',
  'Sprint Planning',
  'Bug Tracker',
  'Feature Ideas',
  'Customer Feedback',
  'Release Notes',
];

const sampleBlockTypes = [
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'bulleted_list',
  'numbered_list',
  'to_do',
  'toggle',
  'quote',
  'code',
  'divider',
];

const sampleContent = [
  'This is a sample paragraph with some content.',
  'Here are some important notes about the project.',
  'We need to discuss this in the next meeting.',
  'This feature is currently in development.',
  'The team has made great progress this week.',
  'Let\'s review the requirements before proceeding.',
  'This needs to be completed by the end of the month.',
  'We should consider alternative approaches.',
  'The user feedback has been very positive.',
  'This is a high-priority item.',
];

const sampleComments = [
  'Great work on this!',
  'Can we add more details here?',
  'I have a question about this section.',
  'This looks good to me.',
  'Let\'s discuss this in the next meeting.',
  'I think we should reconsider this approach.',
  'This is exactly what we needed.',
  'Could you clarify this point?',
  'I agree with this direction.',
  'We might want to add more examples.',
];

const sampleDatabaseTitles = [
  'Task Tracker',
  'Project Database',
  'Team Members',
  'Product Catalog',
  'Customer Database',
  'Event Calendar',
  'Content Library',
  'Resource Hub',
];

const sampleDatabaseRowTitles = [
  'Task 1',
  'Task 2',
  'Task 3',
  'Project Alpha',
  'Project Beta',
  'Project Gamma',
  'John Doe',
  'Jane Smith',
  'Product A',
  'Product B',
  'Customer X',
  'Customer Y',
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.databaseRow.deleteMany();
  await prisma.database.deleteMany();
  await prisma.block.deleteMany();
  await prisma.page.deleteMany();
  await prisma.file.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  console.log('👥 Creating users...');
  const users = [];
  for (let i = 0; i < sampleNames.length; i++) {
    const name = sampleNames[i];
    const email = `user${i + 1}@demo.com`;
    const passwordHash = await bcrypt.hash('demo123', SALT_ROUNDS);
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        timezone: 'UTC',
        locale: 'en',
        preferences: {
          theme: i % 2 === 0 ? 'light' : 'dark',
          notifications: true,
        },
        emailVerifiedAt: new Date(),
        isActive: true,
      },
    });
    users.push(user);
    console.log(`  ✓ Created user: ${name} (${email})`);
  }

  // Create Workspaces
  console.log('🏢 Creating workspaces...');
  const workspaces = [];
  for (let i = 0; i < sampleWorkspaceNames.length; i++) {
    const name = sampleWorkspaceNames[i];
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const plan = i === 0 ? 'enterprise' : i < 3 ? 'team' : i < 5 ? 'personal' : 'free';
    
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug: `${slug}-${i}`,
        icon: ['🚀', '💼', '🎨', '📊', '⚡', '🎯', '🔬', '✨'][i],
        settings: {
          allowPublicPages: i % 2 === 0,
          defaultPageVisibility: 'workspace',
        },
        plan: plan as any,
        maxMembers: plan === 'enterprise' ? 100 : plan === 'team' ? 50 : 10,
        maxStorageGb: plan === 'enterprise' ? 100 : plan === 'team' ? 50 : 5,
        isActive: true,
      },
    });
    workspaces.push(workspace);
    console.log(`  ✓ Created workspace: ${name}`);
  }

  // Create Workspace Members
  console.log('👤 Adding workspace members...');
  for (let i = 0; i < workspaces.length; i++) {
    const workspace = workspaces[i];
    const memberCount = Math.min(3 + Math.floor(Math.random() * 4), users.length);
    const selectedUsers = users.slice(0, memberCount);
    
    for (let j = 0; j < selectedUsers.length; j++) {
      const user = selectedUsers[j];
      const role = j === 0 ? 'owner' : j === 1 ? 'admin' : j === 2 ? 'member' : 'guest';
      
      await prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: role as any,
          permissions: {},
          invitedBy: j === 0 ? null : selectedUsers[0].id,
          invitationAcceptedAt: new Date(),
          lastAccessedAt: new Date(),
          isActive: true,
        },
      });
    }
    console.log(`  ✓ Added ${memberCount} members to ${workspace.name}`);
  }

  // Create Pages
  console.log('📄 Creating pages...');
  const pages = [];
  for (const workspace of workspaces) {
    const workspaceMembers = await prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id, isActive: true },
      include: { user: true },
    });
    
    if (workspaceMembers.length === 0) continue;
    
    const pageCount = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < pageCount; i++) {
      const creator = workspaceMembers[Math.floor(Math.random() * workspaceMembers.length)].user;
      const editor = workspaceMembers[Math.floor(Math.random() * workspaceMembers.length)].user;
      const title = samplePageTitles[Math.floor(Math.random() * samplePageTitles.length)];
      const isDatabase = i === 0 && Math.random() > 0.7; // 30% chance for first page to be database
      
      const page = await prisma.page.create({
        data: {
          workspaceId: workspace.id,
          createdById: creator.id,
          lastEditedById: editor.id,
          title: `${title} - ${workspace.name}`,
          icon: ['📝', '📊', '🎯', '💡', '📋', '🔍', '📌', '⭐'][i % 8],
          type: isDatabase ? 'database' : 'page',
          databaseType: isDatabase ? (['table', 'board', 'calendar'][Math.floor(Math.random() * 3)] as any) : null,
          isFavorite: Math.random() > 0.7,
          visibility: (['private', 'workspace', 'public'][Math.floor(Math.random() * 3)] as any),
          allowComments: true,
          content: {
            blocks: [],
          },
          contentText: sampleContent[Math.floor(Math.random() * sampleContent.length)],
          position: i,
        },
      });
      pages.push(page);
    }
    console.log(`  ✓ Created ${pageCount} pages for ${workspace.name}`);
  }

  // Create Databases for database pages
  console.log('🗄️  Creating databases...');
  const databasePages = pages.filter(p => p.type === 'database');
  for (const page of databasePages) {
    const database = await prisma.database.create({
      data: {
        pageId: page.id,
        workspaceId: page.workspaceId,
        title: sampleDatabaseTitles[Math.floor(Math.random() * sampleDatabaseTitles.length)],
        description: 'A sample database for demonstration purposes.',
        properties: {
          Name: { type: 'title' },
          Status: { type: 'select', options: ['Not Started', 'In Progress', 'Done'] },
          Priority: { type: 'select', options: ['Low', 'Medium', 'High'] },
          'Due Date': { type: 'date' },
          Assignee: { type: 'person' },
        },
        views: [
          {
            id: 'view-1',
            type: 'table',
            name: 'All Items',
            filters: [],
            sorts: [],
          },
        ],
        defaultViewId: 'view-1',
      },
    });

    // Create database rows
    const rowCount = 5 + Math.floor(Math.random() * 10);
    for (let i = 0; i < rowCount; i++) {
      const workspaceMembers = await prisma.workspaceMember.findMany({
        where: { workspaceId: page.workspaceId, isActive: true },
        include: { user: true },
      });
      const creator = workspaceMembers[Math.floor(Math.random() * workspaceMembers.length)].user;
      
      await prisma.databaseRow.create({
        data: {
          databaseId: database.id,
          pageId: page.id,
          createdById: creator.id,
          lastEditedById: creator.id,
          properties: {
            Name: sampleDatabaseRowTitles[Math.floor(Math.random() * sampleDatabaseRowTitles.length)],
            Status: ['Not Started', 'In Progress', 'Done'][Math.floor(Math.random() * 3)],
            Priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
            'Due Date': new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            Assignee: creator.name,
          },
          propertiesText: sampleDatabaseRowTitles[Math.floor(Math.random() * sampleDatabaseRowTitles.length)],
          position: i,
        },
      });
    }
    console.log(`  ✓ Created database with ${rowCount} rows for page: ${page.title}`);
  }

  // Create Blocks for regular pages
  console.log('🧱 Creating blocks...');
  const regularPages = pages.filter(p => p.type === 'page');
  for (const page of regularPages.slice(0, 20)) { // Limit to first 20 pages to avoid too many blocks
    const workspaceMembers = await prisma.workspaceMember.findMany({
      where: { workspaceId: page.workspaceId, isActive: true },
      include: { user: true },
    });
    
    if (workspaceMembers.length === 0) continue;
    
    const blockCount = 3 + Math.floor(Math.random() * 8);
    for (let i = 0; i < blockCount; i++) {
      const creator = workspaceMembers[Math.floor(Math.random() * workspaceMembers.length)].user;
      const editor = workspaceMembers[Math.floor(Math.random() * workspaceMembers.length)].user;
      const blockType = sampleBlockTypes[Math.floor(Math.random() * sampleBlockTypes.length)];
      
      let content: any = {};
      let contentText = '';
      
      switch (blockType) {
        case 'heading_1':
        case 'heading_2':
        case 'heading_3':
          content = { text: `Heading ${i + 1}` };
          contentText = `Heading ${i + 1}`;
          break;
        case 'paragraph':
          content = { text: sampleContent[Math.floor(Math.random() * sampleContent.length)] };
          contentText = content.text;
          break;
        case 'bulleted_list':
        case 'numbered_list':
          content = {
            items: [
              sampleContent[Math.floor(Math.random() * sampleContent.length)],
              sampleContent[Math.floor(Math.random() * sampleContent.length)],
            ],
          };
          contentText = content.items.join(' ');
          break;
        case 'to_do':
          content = {
            text: sampleContent[Math.floor(Math.random() * sampleContent.length)],
            checked: Math.random() > 0.5,
          };
          contentText = content.text;
          break;
        case 'code':
          content = {
            language: 'javascript',
            code: 'function example() {\n  return "Hello, World!";\n}',
          };
          contentText = content.code;
          break;
        default:
          content = { text: sampleContent[Math.floor(Math.random() * sampleContent.length)] };
          contentText = content.text;
      }
      
      await prisma.block.create({
        data: {
          pageId: page.id,
          createdById: creator.id,
          lastEditedById: editor.id,
          type: blockType,
          content,
          contentText,
          position: i,
          depth: 0,
          properties: {},
        },
      });
    }
  }
  console.log(`  ✓ Created blocks for ${Math.min(regularPages.length, 20)} pages`);

  // Create Comments
  console.log('💬 Creating comments...');
  for (const page of pages.slice(0, 15)) { // Limit to first 15 pages
    const workspaceMembers = await prisma.workspaceMember.findMany({
      where: { workspaceId: page.workspaceId, isActive: true },
      include: { user: true },
    });
    
    if (workspaceMembers.length === 0) continue;
    
    const commentCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < commentCount; i++) {
      const user = workspaceMembers[Math.floor(Math.random() * workspaceMembers.length)].user;
      
      await prisma.comment.create({
        data: {
          pageId: page.id,
          userId: user.id,
          content: sampleComments[Math.floor(Math.random() * sampleComments.length)],
          mentions: [],
          isResolved: Math.random() > 0.8,
        },
      });
    }
  }
  console.log(`  ✓ Created comments for pages`);

  // Create Favorites
  console.log('⭐ Creating favorites...');
  for (const user of users.slice(0, 5)) {
    const userWorkspaces = await prisma.workspaceMember.findMany({
      where: { userId: user.id, isActive: true },
      include: { workspace: { include: { pages: true } } },
    });
    
    const favoritePages = [];
    for (const member of userWorkspaces) {
      const pages = member.workspace.pages.slice(0, 2);
      favoritePages.push(...pages);
    }
    
    for (let i = 0; i < Math.min(favoritePages.length, 5); i++) {
      await prisma.favorite.create({
        data: {
          userId: user.id,
          pageId: favoritePages[i].id,
          position: i,
        },
      });
    }
  }
  console.log(`  ✓ Created favorites for users`);

  // Create Activity Logs
  console.log('📊 Creating activity logs...');
  for (const workspace of workspaces) {
    const workspaceMembers = await prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id, isActive: true },
      include: { user: true },
    });
    
    if (workspaceMembers.length === 0) continue;
    
    const logCount = 10 + Math.floor(Math.random() * 20);
    const actions = ['page.created', 'page.updated', 'page.deleted', 'comment.added', 'member.joined', 'workspace.updated'];
    
    for (let i = 0; i < logCount; i++) {
      const user = workspaceMembers[Math.floor(Math.random() * workspaceMembers.length)].user;
      const action = actions[Math.floor(Math.random() * actions.length)];
      const page = pages.find(p => p.workspaceId === workspace.id);
      
      await prisma.activityLog.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          pageId: page?.id,
          action,
          entityType: 'page',
          entityId: page?.id,
          details: {
            description: `${user.name} performed ${action}`,
          },
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log(`  ✓ Created activity logs`);

  // Create Notifications
  console.log('🔔 Creating notifications...');
  for (const user of users.slice(0, 7)) {
    const userWorkspaces = await prisma.workspaceMember.findMany({
      where: { userId: user.id, isActive: true },
      include: { workspace: true },
    });
    
    for (const member of userWorkspaces) {
      const notificationCount = Math.floor(Math.random() * 5);
      const notificationTypes = ['comment.added', 'page.shared', 'member.invited', 'mention.added'];
      
      for (let i = 0; i < notificationCount; i++) {
        const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        const triggeredBy = users[Math.floor(Math.random() * users.length)];
        const page = pages.find(p => p.workspaceId === member.workspace.id);
        
        await prisma.notification.create({
          data: {
            userId: user.id,
            workspaceId: member.workspace.id,
            pageId: page?.id,
            triggeredById: triggeredBy.id,
            type,
            title: `New ${type.replace('.', ' ')}`,
            message: `${triggeredBy.name} ${type === 'comment.added' ? 'commented on' : type === 'page.shared' ? 'shared' : 'mentioned you in'} ${page?.title || 'a page'}`,
            data: {
              pageTitle: page?.title,
            },
            isRead: Math.random() > 0.5,
            readAt: Math.random() > 0.5 ? new Date() : null,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
  }
  console.log(`  ✓ Created notifications`);

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   - ${users.length} users created`);
  console.log(`   - ${workspaces.length} workspaces created`);
  console.log(`   - ${pages.length} pages created`);
  console.log(`   - ${databasePages.length} databases created`);
  console.log(`   - Comments, favorites, activity logs, and notifications created`);
  console.log('\n🔑 Demo Credentials:');
  console.log('   All users have password: demo123');
  for (let i = 0; i < Math.min(5, users.length); i++) {
    console.log(`   - ${users[i].email} (${users[i].name})`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

