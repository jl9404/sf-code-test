import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const future = +new Date() + 30 * 24 * 60 * 60 * 1000;

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: await argon2.hash('examplepassword'),
      roles: ['ADMIN'],
      todos: {
        create: [
          {
            name: 'Admin TODO',
            description: 'haha',
            priority: 'P0',
            tags: ['admin'],
            dueAt: new Date(future),
          },
        ],
      },
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: await argon2.hash('examplepassword'),
      roles: ['USER'],
      todos: {
        create: [
          {
            name: 'User TODO',
            description: 'haha user',
            priority: 'P2',
            tags: ['user'],
            dueAt: new Date(future),
          },
        ],
      },
    },
  });

  const roUser = await prisma.user.upsert({
    where: { email: 'ro-user@example.com' },
    update: {},
    create: {
      email: 'ro-user@example.com',
      password: await argon2.hash('examplepassword'),
      roles: ['READONLY_USER'],
    },
  });

  console.log({ admin, user, roUser });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
