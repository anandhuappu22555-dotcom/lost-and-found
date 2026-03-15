const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get user notifications
router.get('/', verifyToken, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark notification as read
router.put('/read/:id', verifyToken, async (req, res) => {
    try {
        const notification = await prisma.notification.update({
            where: {
                id: parseInt(req.params.id),
                userId: req.user.id // Security check
            },
            data: { read: true }
        });
        res.json(notification);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark all as read
router.put('/read-all', verifyToken, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: {
                userId: req.user.id,
                read: false
            },
            data: { read: true }
        });
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get unread count
router.get('/unread-count', verifyToken, async (req, res) => {
    try {
        const count = await prisma.notification.count({
            where: {
                userId: req.user.id,
                read: false
            }
        });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
