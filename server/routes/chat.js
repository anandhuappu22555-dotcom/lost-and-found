const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Use first 32 bytes of key as utf8 (consistent with imageProcessor)
const CHAT_KEY = Buffer.from(
    (process.env.CHAT_ENCRYPTION_KEY || 'default_32_byte_chat_key_00000000').slice(0, 32),
    'utf8'
);
const IV_LENGTH = 16;

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', CHAT_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(Buffer.from(text)), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    try {
        const [ivHex, ...rest] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(rest.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', CHAT_KEY, iv);
        return Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString();
    } catch { return '[encrypted message]'; }
}

// Helper: verify participant and chat-unlock status
async function getClaimForChat(claimId, userId) {
    const claim = await prisma.claim.findUnique({
        where: { id: parseInt(claimId) },
        include: { foundItem: true }
    });

    if (!claim) return { error: 'Claim not found', status: 404 };

    const isClaimer = claim.claimerId === userId;
    const isFinder = claim.foundItem.finderId === userId;

    if (!isClaimer && !isFinder) {
        return { error: 'Unauthorized to access this chat', status: 403 };
    }

    // Chat only works once finder has approved (status: approved or completed)
    if (claim.status !== 'approved' && claim.status !== 'completed') {
        return {
            error: `Chat is locked. The finder needs to approve the claim first. Current status: ${claim.status}`,
            status: 403
        };
    }

    return { claim, isClaimer, isFinder };
}

// 1. Send a message — BOTH finder and claimer can send once approved
router.post('/:claimId', verifyToken, async (req, res) => {
    try {
        const { claimId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Message content cannot be empty' });
        }

        const result = await getClaimForChat(claimId, req.user.id);
        if (result.error) return res.status(result.status).json({ error: result.error });

        const encryptedContent = encrypt(content.trim());

        const message = await prisma.chatMessage.create({
            data: {
                claimId: parseInt(claimId),
                senderId: req.user.id,
                content: encryptedContent
            },
            include: {
                sender: { select: { id: true, username: true } }
            }
        });

        res.json({
            id: message.id,
            claimId: message.claimId,
            senderId: message.senderId,
            senderName: message.sender?.username || 'Unknown',
            content: content.trim(), // Return unencrypted content to sender
            timestamp: message.timestamp
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get messages — supports ?after=<lastMessageId> for incremental polling
//    Both finder and claimer can read messages once chat is unlocked
router.get('/:claimId', async (req, res) => {
    try {
        const { claimId } = req.params;
        const { after } = req.query; // optional: only fetch messages after this ID

        const claim = await prisma.claim.findUnique({
            where: { id: parseInt(claimId) }
        });

        if (!claim) return res.status(404).json({ error: 'Claim not found' });

        // Chat only works once finder has approved (status: approved or completed)
        if (claim.status !== 'approved' && claim.status !== 'completed') {
            return res.status(403).json({ error: 'Chat is locked. The finder needs to approve the claim first.' });
        }

        // Build query — if `after` is provided, only return newer messages
        const whereClause = { claimId: parseInt(claimId) };
        if (after && !isNaN(parseInt(after))) {
            whereClause.id = { gt: parseInt(after) };
        }

        const messages = await prisma.chatMessage.findMany({
            where: whereClause,
            include: { sender: { select: { id: true, username: true } } },
            orderBy: { timestamp: 'asc' }
        });

        const decryptedMessages = messages.map(msg => ({
            id: msg.id,
            claimId: msg.claimId,
            senderId: msg.senderId,
            senderName: msg.sender?.username || 'Unknown',
            content: decrypt(msg.content),
            timestamp: msg.timestamp
        }));

        res.json(decryptedMessages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
