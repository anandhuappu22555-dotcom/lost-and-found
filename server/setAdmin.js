const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeAdmin(email) {
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'admin' }
        });
        console.log(`✅ Success: User ${user.username} (${user.email}) is now an ADMIN.`);
    } catch (err) {
        console.error(`❌ Error: Could not find user with email ${email}`);
    } finally {
        await prisma.$disconnect();
    }
}

const email = process.argv[2];
if (!email) {
    console.log("Usage: node setAdmin.js <user_email>");
    process.exit(1);
}

makeAdmin(email);
