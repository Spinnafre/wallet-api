import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

const schemas: string[] = [];

export function setup() {
  process.env.NODE_ENV = 'test';

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be defined');
  }

  const schema = `test_${randomUUID().replace(/-/g, '_')}`;
  schemas.push(schema);

  const dbUrl = new URL(process.env.DATABASE_URL);
  dbUrl.searchParams.set('schema', schema);
  process.env.DATABASE_URL = dbUrl.toString();

  console.log(`\n📦 Setting up test database schema: ${schema}`);

  try {
    execSync('npx prisma db push --skip-generate', { env: process.env, stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

export async function teardown() {
  for (const schema of schemas) {
    try {
      const dbUrl = new URL(process.env.DATABASE_URL!);
      dbUrl.searchParams.set('schema', 'public');

      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: dbUrl.toString(),
          },
        },
      });

      console.log(`\n🗑️ Dropping test database schema: ${schema}`);
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE;`);
      await prisma.$disconnect();
    } catch (error) {
      console.error(`Failed to teardown test database schema ${schema}:`, error);
    }
  }
  console.log('\n🗑️ Test specific schema lifecycle ended.');
}
