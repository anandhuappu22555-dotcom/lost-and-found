const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require('../utils/notificationService');

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// 1. Get all pending reviews
router.get('/claims/pending', verifyToken, isAdmin, async (req, res) => {
    try {
        const claims = await prisma.claim.findMany({
            where: { status: 'admin_review' },
            include: {
                claimer: { select: { username: true, email: true, trustScore: true } },
                foundItem: { include: { finder: { select: { username: true, email: true } } } },
                lostItem: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(claims);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Approve or Reject a Claim
router.post('/claims/:id/action', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body; // 'approve' or 'reject'

        const claim = await prisma.claim.findUnique({
            where: { id: parseInt(id) },
            include: { foundItem: true, lostItem: true, claimer: true }
        });

        if (!claim) return res.status(404).json({ error: 'Claim not found' });

        if (action === 'approve') {
            // Update claim status
            await prisma.claim.update({
                where: { id: parseInt(id) },
                data: { status: 'approved' }
            });

            // Reveal Image
            await prisma.foundItem.update({
                where: { id: claim.foundItemId },
                data: { imageVisibilityStatus: 'revealed' }
            });

            // Notifications
            await createNotification(claim.claimerId, {
                title: 'Ownership Verified! 🎉',
                message: `Admin has approved your proof for ${claim.foundItem.itemName}. Chat enabled.`,
                type: 'system',
                link: `/claim/${claim.id}`
            });

            await createNotification(claim.foundItem.finderId, {
                title: 'Proof Verified by Admin',
                message: `The claim for ${claim.foundItem.itemName} is verified. Please coordinate handover.`,
                type: 'system',
                link: `/claim/${claim.id}`
            });

            res.json({ message: 'Claim approved and image revealed.' });
        } else if (action === 'reject') {
            await prisma.claim.update({
                where: { id: parseInt(id) },
                data: { status: 'rejected' }
            });

            // Reset items to active for new matches
            await prisma.foundItem.update({
                where: { id: claim.foundItemId },
                data: { status: 'active' }
            });

            if (claim.lostItemId) {
                await prisma.lostItem.update({
                    where: { id: claim.lostItemId },
                    data: { status: 'active' }
                });
            }

            // Notification
            await createNotification(claim.claimerId, {
                title: 'Claim Rejected',
                message: `Admin rejected your claim for ${claim.foundItem.itemName}. Reason: ${reason || 'Insufficient proof'}`,
                type: 'system',
                link: `/claim/${claim.id}`
            });

            res.json({ message: 'Claim rejected and items reset to active.' });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
