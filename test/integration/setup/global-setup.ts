import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

export async function setup() {
  process.env.NODE_ENV = 'test';

  // Use independent schema for parallel execution isolation
  const schema = `test_${randomUUID().replace(/-/g, '_')}`;
  process.env.DATABASE_URL = `postgresql://wallet:wallet-pass@localhost:5433/wallet-db-test?schema=${schema}`;

  console.log(`\n📦 Setting up test database schema: ${schema}`);

  try {
    execSync('npx prisma db push --skip-generate', { env: process.env, stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

export async function teardown() {
  console.log('\n🗑️ Test specific schema lifecycle ended.');
}
