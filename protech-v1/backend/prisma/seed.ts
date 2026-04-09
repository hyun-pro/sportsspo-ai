import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@protech.com' },
    update: {},
    create: {
      email: 'admin@protech.com',
      password: adminPassword,
      name: '관리자',
      role: 'ADMIN',
      subscription: {
        create: { plan: 'ENTERPRISE', status: 'ACTIVE', maxAnalysis: -1 },
      },
    },
  });

  // Create demo user
  const userPassword = await bcrypt.hash('user1234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@protech.com' },
    update: {},
    create: {
      email: 'demo@protech.com',
      password: userPassword,
      name: '데모 사용자',
      role: 'USER',
      subscription: {
        create: { plan: 'PRO', status: 'ACTIVE', maxAnalysis: 500, analysisCount: 12 },
      },
    },
  });

  console.log('Seed completed:', { admin: admin.email, user: user.email });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
