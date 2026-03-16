const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  console.log('Testing Supabase Connection...');
  try {
    await prisma.$connect();
    console.log('✅ Connection Successful!');
    const userCount = await prisma.user.count();
    console.log(`User Count: ${userCount}`);
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
    if (err.message.includes('Tenant or user not found')) {
      console.log('💡 TIP: This is often a PgBouncer issue. Ensure ?pgbouncer=true is in the DATABASE_URL.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
