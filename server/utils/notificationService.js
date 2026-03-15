const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendMatchNotificationEmail } = require('./emailService');

const createNotification = async (userId, data) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                title: data.title,
                message: data.message,
                type: data.type || 'system',
                link: data.link || null,
            }
        });

        // Also send email if it's an important notification (like a match)
        if (data.sendEmail) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user && user.email) {
                // Determine which email to send based on type
                if (data.type === 'match') {
                    await sendMatchNotificationEmail(user.email, data.itemName || 'item', data.link);
                }
            }
        }

        return notification;
    } catch (err) {
        console.error('Error creating notification:', err);
    }
};

const notifyMatch = async (matchId) => {
    try {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                lostItem: { include: { user: true } },
                foundItem: { include: { finder: true } }
            }
        });

        if (!match) return;

        // Notify the owner of the Lost Item
        await createNotification(match.lostItem.userId, {
            title: 'New Match Found!',
            message: `A potential match was found for your ${match.lostItem.category}. Confidence: ${match.confidence}%`,
            type: 'match',
            link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/matches/${match.lostItemId}`,
            sendEmail: true,
            itemName: match.lostItem.itemName || match.lostItem.category
        });

        // Notify the Finder of the Found Item
        await createNotification(match.foundItem.finderId, {
            title: 'Your Found Item matches a report!',
            message: `Someone lost a ${match.lostItem.category} that matches the item you found. Confidence: ${match.confidence}%`,
            type: 'match',
            link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/matches/${match.lostItemId}`,
            sendEmail: true,
            itemName: match.foundItem.itemName || match.foundItem.category
        });

    } catch (err) {
        console.error('Error in notifyMatch:', err);
    }
};

const notifyClaimStatusChange = async (claimId, status) => {
    try {
        const claim = await prisma.claim.findUnique({
            where: { id: claimId },
            include: {
                claimer: true,
                foundItem: true
            }
        });

        if (!claim) return;

        const isApproved = status === 'approved';

        await createNotification(claim.claimerId, {
            title: isApproved ? 'Claim Approved! 🎉' : 'Claim Rejected',
            message: isApproved
                ? `Verification successful for "${claim.foundItem.category}". Secure chat is now unlocked.`
                : `Verification for "${claim.foundItem.category}" was unsuccessful. Please check your data.`,
            type: isApproved ? 'success' : 'alert',
            link: `/claim/${claim.id}`,
            sendEmail: true
        });

    } catch (err) {
        console.error('Error reporting claim status change:', err);
    }
};

module.exports = { createNotification, notifyMatch, notifyClaimStatusChange };
