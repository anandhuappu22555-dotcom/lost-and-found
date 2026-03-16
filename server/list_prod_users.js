const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
    console.log('Fetching users from Production Database...');
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, username: true, role: true }
        });
        console.log('USERS:', JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
