const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { decryptFile } = require('../utils/imageProcessor');
const prisma = new PrismaClient();
const path = require('path');

router.get('/original/:itemId', verifyToken, async (req, res) => {
    try {
        const { itemId } = req.params;

        // 1. Find Item
        const item = await prisma.foundItem.findUnique({ where: { id: parseInt(itemId) } });
        if (!item) return res.status(404).json({ error: 'Item not found' });

        // 2. Access Control Check
        let hasAccess = false;
        if (req.user.role === 'admin') hasAccess = true;
        if (item.finderId === req.user.id) hasAccess = true;

        if (!hasAccess) {
            const claim = await prisma.claim.findFirst({
                where: {
                    foundItemId: item.id,
                    claimerId: req.user.id,
                    status: 'approved'
                }
            });
            if (claim) hasAccess = true;
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'Image reveal restricted until claim approval.' });
        }

        // 3. Decrypt and Serve
        if (!item.originalImageUrl) return res.status(404).json({ error: 'Original image not found' });

        const absolutePath = path.join(__dirname, '../', item.originalImageUrl);
        if (!require('fs').existsSync(absolutePath)) {
            return res.status(404).json({ error: 'Original encrypted file missing' });
        }

        res.set('Content-Type', 'image/jpeg');
        if (absolutePath.endsWith('.enc')) {
            decryptFile(absolutePath, res);
        } else {
            const fs = require('fs');
            fs.createReadStream(absolutePath).pipe(res);
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
