import { PrismaClient, GlobalRole, CommunityRole, ChannelType, MessageType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for SyBorx-Messenger...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Clean existing records (in reverse dependency order)
  await prisma.messageReaction.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.communityMember.deleteMany();
  await prisma.community.deleteMany();
  await prisma.directChatMember.deleteMany();
  await prisma.directChat.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users with different RBAC roles
  const superadmin = await prisma.user.create({
    data: {
      email: 'ceo@syborx.com',
      username: 'ceo_syborx',
      passwordHash,
      displayName: 'CEO & Founder',
      globalRole: GlobalRole.SUPERADMIN,
      bio: 'Liderazgo ejecutivo y estratégico en SyBorx Technologies.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@syborx.com',
      username: 'admin_syborx',
      passwordHash,
      displayName: 'System Admin',
      globalRole: GlobalRole.ADMIN,
      bio: 'Administrador de plataforma, gestión de roles y políticas de seguridad.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const techLead = await prisma.user.create({
    data: {
      email: 'techlead@syborx.com',
      username: 'techlead_edgar',
      passwordHash,
      displayName: 'Tech Lead Engineer',
      globalRole: GlobalRole.TECH_LEAD,
      bio: 'Líder técnico de arquitectura y desarrollo fullstack.',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  const developer = await prisma.user.create({
    data: {
      email: 'dev@syborx.com',
      username: 'dev_alex',
      passwordHash,
      displayName: 'Alex Frontend Dev',
      globalRole: GlobalRole.DEVELOPER,
      bio: 'Ingeniero de Software enfocado en interfaces interactivas y React.',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const gmailUser = await prisma.user.create({
    data: {
      email: 'tester.syborx@gmail.com',
      username: 'tester_gmail',
      passwordHash,
      displayName: 'External QA Tester',
      globalRole: GlobalRole.GUEST,
      bio: 'Usuario de pruebas vía Gmail para control de calidad.',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    },
  });

  console.log('✅ Users created with standard password: Password123!');

  // 3. Create Communities (Servers/Workspaces)
  const mainCommunity = await prisma.community.create({
    data: {
      name: 'SyBorx Engineering Hub',
      description: 'Espacio de trabajo colaborativo para los equipos de ingeniería de SyBorx.',
      ownerId: techLead.id,
      iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      members: {
        create: [
          { userId: techLead.id, role: CommunityRole.COMMUNITY_OWNER, nickname: 'Lead Edgar' },
          { userId: admin.id, role: CommunityRole.COMMUNITY_ADMIN, nickname: 'Admin Global' },
          { userId: superadmin.id, role: CommunityRole.COMMUNITY_ADMIN, nickname: 'CEO' },
          { userId: developer.id, role: CommunityRole.COMMUNITY_MEMBER, nickname: 'Alex Frontend' },
          { userId: gmailUser.id, role: CommunityRole.COMMUNITY_MEMBER, nickname: 'QA Tester' },
        ],
      },
    },
  });

  // 4. Create Channels for the community
  const generalChannel = await prisma.channel.create({
    data: {
      communityId: mainCommunity.id,
      name: 'general',
      topic: 'Canal general de anuncios y bienvenida a la comunidad SyBorx.',
      type: ChannelType.TEXT,
      position: 0,
    },
  });

  const backendChannel = await prisma.channel.create({
    data: {
      communityId: mainCommunity.id,
      name: 'dev-backend',
      topic: 'Discusión sobre APIs, PostgreSQL, Docker y arquitectura NestJS.',
      type: ChannelType.TEXT,
      position: 1,
    },
  });

  const frontendChannel = await prisma.channel.create({
    data: {
      communityId: mainCommunity.id,
      name: 'dev-frontend',
      topic: 'Coordinación con el equipo de frontend para el cliente de mensajería.',
      type: ChannelType.TEXT,
      position: 2,
    },
  });

  console.log('✅ Community and channels created.');

  // 5. Create initial Welcome Messages
  const welcomeMsg = await prisma.message.create({
    data: {
      senderId: techLead.id,
      channelId: generalChannel.id,
      content: '¡Bienvenidos al servidor central de SyBorx-Messenger! El backend con PostgreSQL y Docker está 100% operativo.',
      messageType: MessageType.TEXT,
      isPinned: true,
    },
  });

  await prisma.messageReaction.create({
    data: {
      messageId: welcomeMsg.id,
      userId: developer.id,
      emoji: '🚀',
    },
  });

  // 6. Create Direct Chat (1 to 1) between Tech Lead and Developer
  const dmChat = await prisma.directChat.create({
    data: {
      members: {
        create: [
          { userId: techLead.id },
          { userId: developer.id },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      senderId: techLead.id,
      directChatId: dmChat.id,
      content: 'Hola Alex, el backend está listo con Swagger en /api/docs y WebSockets para que puedas empezar a conectar la UI.',
      messageType: MessageType.TEXT,
    },
  });

  console.log('✅ Direct Chat and Seed data successfully initialized!');
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
