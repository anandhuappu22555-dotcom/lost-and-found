const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper: Haversine Distance in km
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Trigger Match for a specific lost item
router.post('/match/:lostItemId', verifyToken, async (req, res) => {
    try {
        const { lostItemId } = req.params;
        const lostItem = await prisma.lostItem.findUnique({ where: { id: parseInt(lostItemId) } });
        if (!lostItem) return res.status(404).json({ error: 'Item not found' });

        // 1. Fetch potential candidates (Found Items)
        const candidates = await prisma.foundItem.findMany({
            where: {
                status: { in: ['active', 'match_found'] },
            }
        });

        const scoredMatches = candidates.map(found => {
            let score = 0;
            const details = {};

            // A. Category Match (30%)
            if (found.category.toLowerCase() === lostItem.category.toLowerCase()) {
                score += 30;
                details.category = "Match";
            } else {
                details.category = "Mismatch";
            }

            // B. Location Proximity (30%)
            // If both have lat/lng
            if (lostItem.lat && lostItem.lng && found.lat && found.lng) {
                const dist = getDistanceFromLatLonInKm(lostItem.lat, lostItem.lng, found.lat, found.lng);
                if (dist < 0.5) { // < 500m
                    score += 30;
                    details.location = "Exact Area (<500m)";
                } else if (dist < 2) { // < 2km
                    score += 20;
                    details.location = "Nearby (<2km)";
                } else if (dist < 10) {
                    score += 10;
                    details.location = "Same City Area";
                } else {
                    details.location = "Far";
                }
            } else {
                // If detailed location text matches fuzzy? Skip for MVP
                details.location = "Unknown";
            }

            // C. Time Proximity (20%)
            // Found date should be AFTER Lost date roughly, or very close.
            const lostDate = new Date(lostItem.dateLost);
            const foundDate = new Date(found.createdAt); // found.date_found might be better if schema has it, schema has dateFound? No, schema has date_found in SQL but not clearly in my view of prisma file? 
            // Wait, schema.prisma showed `createdAt` for FoundItem, but `dateFound` was NOT in schema.prisma view I saw earlier? 
            // Let me check schema again? 
            // `FoundItem` model in schema lines 56-71: `createdAt DateTime @default(now())`. It does NOT have dateFound.
            // Using `createdAt` as proxy for dateFound.

            const timeDiff = Math.abs(foundDate - lostDate);
            const daysDiff = timeDiff / (1000 * 3600 * 24);

            if (foundDate >= lostDate || daysDiff < 1) { // Allowing same day edge cases
                if (daysDiff < 2) {
                    score += 20;
                    details.time = "Found within 48hrs";
                } else if (daysDiff < 7) {
                    score += 10;
                    details.time = "Found within week";
                } else {
                    details.time = "> 1 week gap";
                }
            } else {
                details.time = "Found before lost? (Unlikely)";
            }

            // D. Visual / Metadata (Color/Material/Keywords) (20%)
            let metaScore = 0;
            // Keywords
            const combinedFoundText = (found.category + " " + (found.condition || "") + " " + (found.storagePlace || "")).toLowerCase();
            const combinedLostText = (lostItem.color + " " + lostItem.material + " " + lostItem.description + " " + lostItem.uniqueMarks).toLowerCase();

            // Simple keyword overlap
            const keywords = combinedLostText.split(/\s+/).filter(w => w.length > 3);
            let matches = 0;
            keywords.forEach(w => {
                if (combinedFoundText.includes(w)) matches++;
            });

            if (matches > 0) metaScore += 10;
            if (matches > 2) metaScore += 10;

            score += metaScore;
            details.metadata = `${matches} keywords matched`;

            // E. Final Confidence
            // Cap at 99
            score = Math.min(score, 99);

            return {
                foundItem: found,
                score,
                details
            };
        });

        // Filter by threshold > 40% for "Possible Match"
        const finalMatches = scoredMatches
            .filter(m => m.score > 40)
            .sort((a, b) => b.score - a.score);

        // Store matches in DB (optional, or just return)
        // Storing allows "Viewed" status later
        // For MVP, just returning is faster for UI, but let's persist high conf ones

        /* 
        // Example persistence
        for (const m of finalMatches) {
             if (m.score > 70) {
                 await prisma.match.create({ data: ... })
             }
        }
        */

        if (finalMatches.length === 0) {
            return res.json({
                status: "waiting",
                message: "No match found yet. Please wait for new data."
            });
        }

        res.json({
            status: "success",
            matches: finalMatches,
            source: 'ai-heuristic-v1'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
