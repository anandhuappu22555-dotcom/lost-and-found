const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { enforceStateMachine } = require('../middleware/stateMachine');

// 1. Initialize a Claim
router.post('/init', verifyToken, async (req, res) => {
    try {
        const { foundItemId, lostItemId } = req.body;

        const foundItem = await prisma.foundItem.findUnique({ where: { id: foundItemId } });
        if (!foundItem || (foundItem.status !== 'active' && foundItem.status !== 'match_found')) {
            return res.status(400).json({ error: 'Item is not available for claim.' });
        }

        const claim = await prisma.claim.create({
            data: {
                foundItemId,
                lostItemId: lostItemId || null,
                claimerId: req.user.id,
                status: 'verification_pending'
            }
        });

        res.json(claim);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Submit Verification Answers → goes to FINDER for review
router.post('/verify/:id', verifyToken, enforceStateMachine('claim'), async (req, res) => {
    try {
        const { id } = req.params;
        const { verificationData } = req.body;

        const claim = await prisma.claim.findUnique({
            where: { id: parseInt(id) },
            include: { foundItem: true, lostItem: true }
        });

        if (!claim || claim.claimerId !== req.user.id) {
            return res.status(404).json({ error: 'Claim not found' });
        }

        if (claim.status !== 'verification_pending') {
            return res.status(400).json({ error: 'Verification cannot be submitted in current state.' });
        }

        // Move to finder_review — finder decides whether to enable chat
        const updatedClaim = await prisma.claim.update({
            where: { id: parseInt(id) },
            data: {
                verificationData: JSON.stringify(verificationData),
                status: 'finder_review'
            }
        });

        // Notify the finder
        const { createNotification } = require('../utils/notificationService');
        await createNotification(claim.foundItem.finderId, {
            title: '📋 Someone Claims Your Found Item',
            message: `A user has submitted verification answers for your found item "${claim.foundItem.itemName || claim.foundItem.category}". Review their answers and decide whether to enable chat.`,
            type: 'claim',
            link: `/dashboard`
        });

        res.json({ message: 'Verification answers sent to the finder for review.', claim: updatedClaim });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. FINDER ACTION — Approve (enable chat) or Reject a claim
router.post('/:id/finder-action', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        const claim = await prisma.claim.findUnique({
            where: { id: parseInt(id) },
            include: { foundItem: true, lostItem: true, claimer: { select: { id: true, username: true } } }
        });

        if (!claim) return res.status(404).json({ error: 'Claim not found' });

        // Only the finder of the found item can take action
        if (claim.foundItem.finderId !== req.user.id) {
            return res.status(403).json({ error: 'Only the finder can take action on this claim.' });
        }

        if (claim.status !== 'finder_review') {
            return res.status(400).json({ error: 'This claim is not pending your review.' });
        }

        const { createNotification } = require('../utils/notificationService');

        if (action === 'approve') {
            // Reveal image and enable chat
            await prisma.foundItem.update({
                where: { id: claim.foundItemId },
                data: { imageVisibilityStatus: 'revealed', status: 'match_found' }
            });
            if (claim.lostItemId) {
                await prisma.lostItem.update({
                    where: { id: claim.lostItemId },
                    data: { status: 'match_found' }
                });
            }
            await prisma.claim.update({
                where: { id: parseInt(id) },
                data: { status: 'approved' }
            });

            // Notify the claimer
            await createNotification(claim.claimerId, {
                title: '🎉 Finder Approved Your Claim!',
                message: `The finder has reviewed your answers and approved your claim. Secure chat is now unlocked!`,
                type: 'claim',
                link: `/claim/${claim.id}`
            });

            return res.json({ message: 'Claim approved. Chat is now enabled.', status: 'approved' });
        }

        if (action === 'reject') {
            await prisma.claim.update({
                where: { id: parseInt(id) },
                data: { status: 'rejected' }
            });

            // Reset items to active
            await prisma.foundItem.update({ where: { id: claim.foundItemId }, data: { status: 'active' } });
            if (claim.lostItemId) {
                await prisma.lostItem.update({ where: { id: claim.lostItemId }, data: { status: 'active' } });
            }

            // Notify the claimer
            await createNotification(claim.claimerId, {
                title: '❌ Claim Rejected by Finder',
                message: `The finder has reviewed your answers and rejected your claim. You may try again or report this issue.`,
                type: 'claim',
                link: `/claim/${claim.id}`
            });

            return res.json({ message: 'Claim rejected.', status: 'rejected' });
        }

        res.status(400).json({ error: 'Invalid action. Use approve or reject.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Get claims made by the logged-in user (claimer side)
router.get('/my-claims', verifyToken, async (req, res) => {
    try {
        const claims = await prisma.claim.findMany({
            where: { claimerId: req.user.id },
            include: { foundItem: true, lostItem: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(claims);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Get claims on items the logged-in user FOUND (finder side)
router.get('/finder-claims', verifyToken, async (req, res) => {
    try {
        const claims = await prisma.claim.findMany({
            where: {
                foundItem: { finderId: req.user.id },
                status: { in: ['finder_review', 'approved', 'rejected'] }
            },
            include: {
                foundItem: true,
                lostItem: true,
                claimer: { select: { id: true, username: true, email: true, trustScore: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(claims);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Get single claim details
router.get('/:claimId', verifyToken, async (req, res) => {
    try {
        const { claimId } = req.params;
        const claim = await prisma.claim.findUnique({
            where: { id: parseInt(claimId) },
            include: {
                foundItem: true,
                lostItem: true,
                claimer: { select: { username: true, email: true, trustScore: true } }
            }
        });

        if (!claim) return res.status(404).json({ error: 'Claim not found' });

        const isParticipant = claim.claimerId === req.user.id || claim.foundItem.finderId === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isParticipant && !isAdmin) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        res.json(claim);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
