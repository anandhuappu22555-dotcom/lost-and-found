const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../uploads/originals');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer uses absolute paths to avoid any working-directory confusion
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Safe image processing — NEVER crashes the server
async function processImage(absoluteFilePath, maskImage) {
    const relativePath = 'uploads/originals/' + path.basename(absoluteFilePath);

    if (!maskImage) {
        return { imageUrl: relativePath, originalImageUrl: relativePath };
    }

    try {
        const { generateMaskedImage, encryptFile } = require('../utils/imageProcessor');

        // Generate blurred version — pass absolute path
        const maskedRelPath = await generateMaskedImage(absoluteFilePath);

        // Encrypt original synchronously
        const encAbsPath = absoluteFilePath + '.enc';
        encryptFile(absoluteFilePath, encAbsPath);

        // Remove plain original after successful encryption
        try { fs.unlinkSync(absoluteFilePath); } catch (e) { /* already gone */ }

        return {
            imageUrl: maskedRelPath,
            originalImageUrl: 'uploads/originals/' + path.basename(encAbsPath)
        };
    } catch (err) {
        console.error('⚠️  Image processing failed (using original):', err.message);
        return { imageUrl: relativePath, originalImageUrl: relativePath };
    }
}

// POST /lost — Report a lost item
router.post('/lost', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { itemName, category, color, material, dateLost, locationText, lat, lng, description, uniqueMarks } = req.body;

        if (!itemName || !category || !dateLost || !lat || !lng) {
            return res.status(400).json({ error: 'Missing required fields: itemName, category, dateLost, location' });
        }

        let imageUrl = null;
        let originalImageUrl = null;

        if (req.file) {
            const maskImage = req.body.maskImage === 'true';
            const result = await processImage(req.file.path, maskImage);
            imageUrl = result.imageUrl;
            originalImageUrl = result.originalImageUrl;
        }

        let item;
        try {
            item = await prisma.lostItem.create({
                data: {
                    userId: req.user.id,
                    itemName,
                    category,
                    color: color || null,
                    material: material || null,
                    dateLost: new Date(dateLost),
                    locationText,
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    description: description || null,
                    uniqueMarks: uniqueMarks || null,
                    imageUrl,
                    originalImageUrl,
                    status: 'active'
                }
            });
        } catch (dbErr) {
            // Fallback for when migrations haven't run/failed
            // Using a case-insensitive regex to catch various Prisma error formats
            if (/originalImageUrl/i.test(dbErr.message)) {
                console.warn('⚠️  Database schema out of sync (originalImageUrl missing). Falling back to simple item creation.');
                item = await prisma.lostItem.create({
                    data: {
                        userId: req.user.id,
                        itemName,
                        category,
                        color: color || null,
                        material: material || null,
                        dateLost: new Date(dateLost),
                        locationText,
                        lat: parseFloat(lat),
                        lng: parseFloat(lng),
                        description: description || null,
                        uniqueMarks: uniqueMarks || null,
                        imageUrl, // at least save the main image
                        status: 'active'
                    }
                });
            } else {
                console.error('❌ Database Item Creation Error:', dbErr.message);
                throw dbErr;
            }
        }

        // Run AI matching in background — non-blocking
        const { findMatches } = require('../utils/aiMatcher');
        findMatches(item, 'lost').catch(err => console.error('Matching Error:', err.message));

        // Notify the user immediately
        const { createNotification } = require('../utils/notificationService');
        await createNotification(req.user.id, {
            title: '📡 Searching for Matches...',
            message: `Your lost report for "${itemName}" has been posted. We will notify you when a match is found.`,
            type: 'system',
            link: '/dashboard'
        });

        res.json({ success: true, ...item });
    } catch (err) {
        console.error('[POST /lost] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /found — Report a found item
router.post('/found', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { itemName, category, lat, lng, condition, storagePlace, finderPreference, locationText } = req.body;

        if (!itemName || !category || !lat || !lng) {
            return res.status(400).json({ error: 'Name, category, and location are required.' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'An image is required for found items.' });
        }

        const maskImage = req.body.maskImage === 'true';
        const { imageUrl, originalImageUrl } = await processImage(req.file.path, maskImage);

        let item;
        try {
            item = await prisma.foundItem.create({
                data: {
                    finderId: req.user.id,
                    itemName,
                    category,
                    locationText: locationText || null,
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    condition: condition || null,
                    storagePlace: storagePlace || null,
                    finderPreference: finderPreference || null,
                    imageUrl,
                    originalImageUrl,
                    status: 'active'
                }
            });
        } catch (dbErr) {
            // Fallback for when migrations haven't run/failed
            if (/originalImageUrl/i.test(dbErr.message)) {
                console.warn('⚠️  Database schema out of sync (originalImageUrl missing). Falling back to simple item creation.');
                item = await prisma.foundItem.create({
                    data: {
                        finderId: req.user.id,
                        itemName,
                        category,
                        locationText: locationText || null,
                        lat: parseFloat(lat),
                        lng: parseFloat(lng),
                        condition: condition || null,
                        storagePlace: storagePlace || null,
                        finderPreference: finderPreference || null,
                        imageUrl,
                        status: 'active'
                    }
                });
            } else {
                console.error('❌ Database Item Creation Error:', dbErr.message);
                throw dbErr;
            }
        }

        // Run AI matching in background — non-blocking
        const { findMatches } = require('../utils/aiMatcher');
        findMatches(item, 'found').catch(err => console.error('Matching Error:', err.message));

        // Notify the user immediately
        const { createNotification } = require('../utils/notificationService');
        await createNotification(req.user.id, {
            title: '👁️ Item Listed Successfully',
            message: `Thank you for reporting the found "${itemName}". We will notify you when the owner claims it.`,
            type: 'system',
            link: '/dashboard'
        });

        res.json({ success: true, ...item });
    } catch (err) {
        console.error('[POST /found] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /lost/:id — Single lost item
router.get('/lost/:id', async (req, res) => {
    try {
        const item = await prisma.lostItem.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /lost — All active lost items
router.get('/lost', async (req, res) => {
    try {
        const items = await prisma.lostItem.findMany({
            where: { status: 'active' },
            include: { user: { select: { username: true } } }
        });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /found — All active found items
router.get('/found', async (req, res) => {
    try {
        const items = await prisma.foundItem.findMany({ 
            where: { 
                status: { in: ['active', 'match_found'] } 
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /my-items - All items reported by logged-in user
router.get('/my-items', verifyToken, async (req, res) => {
    try {
        const myLost = await prisma.lostItem.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        const myFound = await prisma.foundItem.findMany({
            where: { finderId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ lost: myLost, found: myFound });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
