const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
    console.log('🗑️ Starting Database Cleanup...');
    try {
        // Correct order to handle foreign keys
        await prisma.notification.deleteMany();
        await prisma.chatMessage.deleteMany();
        await prisma.claim.deleteMany();
        await prisma.match.deleteMany();
        await prisma.lostItem.deleteMany();
        await prisma.foundItem.deleteMany();
        await prisma.trustScore.deleteMany();
        await prisma.report.deleteMany();
        await prisma.confirmationToken.deleteMany();
        await prisma.loginSession.deleteMany();
        await prisma.user.deleteMany();

        console.log('✅ Success: All accounts and associated data have been deleted.');
        console.log('🚀 Your database is now fresh and ready for new users.');
    } catch (err) {
        console.error('❌ Error during cleanup:', err);
    } finally {
        await prisma.$disconnect();
    }
}

reset();
