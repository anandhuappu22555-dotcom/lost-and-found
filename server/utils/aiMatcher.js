const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Haversine formula to calculate distance between two points in km
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Simple text similarity based on token overlap
function calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    // Lowered minimum token length to 2 to capture "13", "My", "TV", etc.
    const tokens1 = text1.toLowerCase().split(/\W+/).filter(t => t.length >= 2);
    const tokens2 = text2.toLowerCase().split(/\W+/).filter(t => t.length >= 2);

    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    const intersection = tokens1.filter(t => tokens2.includes(t));
    const score = intersection.length / Math.max(tokens1.length, tokens2.length);

    console.log(`Debug Text: [${tokens1.join(', ')}] vs [${tokens2.join(', ')}] -> Int: ${intersection.length}, Sim: ${score.toFixed(2)}`);
    return score;
}

/**
 * Calculates a confidence score between 0 and 100 for a potential match.
 */
function calculateMatchScore(lost, found) {
    let score = 0;
    console.log(`\n--- Scoring Match: Lost(${lost.id}) vs Found(${found.id}) ---`);
    console.log(`Items: "${lost.itemName}" vs "${found.itemName}"`);

    // 1. Category (Mandatory match usually, but here we add weight)
    if (lost.category === found.category) {
        score += 30;
        console.log(`✅ Category Match (${lost.category}): +30`);
    } else {
        console.log(`❌ Category Mismatch: ${lost.category} vs ${found.category}`);
        return 0; // Strict category matching for now
    }

    // 2. Item Name Similarity (Weight: 40)
    const nameSim = calculateTextSimilarity(lost.itemName || "", found.itemName || "");
    const nameScore = Math.round(nameSim * 40);
    score += nameScore;
    console.log(`Name Similarity score: +${nameScore}`);

    // 3. Description Similarity (Weight: 20)
    const descSim = calculateTextSimilarity(lost.description || "", found.description || "");
    const descScore = Math.round(descSim * 20);
    score += descScore;
    console.log(`Desc Similarity score: +${descScore}`);

    // 4. Location Proximity (Weight: 20)
    const distance = calculateDistance(lost.lat, lost.lng, found.lat, found.lng);
    let locScore = 0;
    if (distance !== null) {
        if (distance < 0.2) locScore = 20;      // < 200m (Great!)
        else if (distance < 1) locScore = 15;   // < 1km
        else if (distance < 3) locScore = 10;   // < 3km
        else if (distance < 10) locScore = 5;   // < 10km
        score += locScore;
        console.log(`Location Distance: ${distance.toFixed(2)}km -> +${locScore}`);
    } else {
        console.log(`Location: No coordinates available`);
    }

    // 5. Temporal Proximity (Weight: 10)
    const lostDate = new Date(lost.dateLost);
    const foundDate = new Date(found.createdAt);
    const timeDiff = Math.abs(lostDate - foundDate) / (1000 * 60 * 60 * 24); // days

    let timeScore = 0;
    if (timeDiff < 1) timeScore = 10;
    else if (timeDiff < 5) timeScore = 5;
    else if (timeDiff < 14) timeScore = 2;
    score += timeScore;
    console.log(`Temporal Diff: ${timeDiff.toFixed(2)} days -> +${timeScore}`);

    const finalScore = Math.min(100, Math.round(score));
    console.log(`TOTAL SCORE: ${finalScore}/100`);
    return finalScore;
}

/**
 * Finds potential matches for a newly created item and creates records.
 */
const findMatches = async (newItem, type) => {
    console.log(`--- AI Matching Triggered for ${type} Item: ${newItem.id} ---`);

    try {
        let potentialMatches = [];
        const THRESHOLD = 50; // Lowered from 60 for better matches during testing

        // Fallback for items missing itemName (legacy data)
        const normalizeItem = (item) => {
            if (!item.itemName && item.description) {
                return { ...item, itemName: item.description.substring(0, 50) };
            }
            return item;
        };

        const normalizedNewItem = normalizeItem(newItem);

        if (type === 'lost') {
            const foundItems = await prisma.foundItem.findMany({
                where: { status: 'active' } // Only match against available items
            });
            console.log(`Checking against ${foundItems.length} active found items...`);
            for (let item of foundItems) {
                item = normalizeItem(item);
                const score = calculateMatchScore(normalizedNewItem, item);
                if (score >= THRESHOLD) {
                    potentialMatches.push({ item, score });
                }
            }
        } else {
            const lostItems = await prisma.lostItem.findMany({
                where: { status: 'active' } // Only match against items still looking
            });
            console.log(`Checking against ${lostItems.length} active lost items...`);
            for (let item of lostItems) {
                item = normalizeItem(item);
                const score = calculateMatchScore(item, normalizedNewItem);
                if (score >= THRESHOLD) {
                    potentialMatches.push({ item, score });
                }
            }
        }

        // Create match records and trigger notifications
        for (const match of potentialMatches) {
            const lostId = type === 'lost' ? newItem.id : match.item.id;
            const foundId = type === 'found' ? newItem.id : match.item.id;

            const existingMatch = await prisma.match.findFirst({
                where: { lostItemId: lostId, foundItemId: foundId }
            });

            if (!existingMatch) {
                const newMatch = await prisma.match.create({
                    data: {
                        lostItemId: lostId,
                        foundItemId: foundId,
                        confidence: match.score,
                        status: 'active' // Use 'active' to signify an unverified match
                    }
                });

                // Update Items to match_found (Locking them)
                await prisma.lostItem.update({
                    where: { id: lostId },
                    data: { status: 'match_found' }
                });
                await prisma.foundItem.update({
                    where: { id: foundId },
                    data: { status: 'match_found' }
                });

                console.log(`🎉 Match Found & Items Locked! Confidence: ${match.score}% (Lost: ${lostId}, Found: ${foundId})`);

                // Trigger notification
                const { notifyMatch } = require('./notificationService');
                await notifyMatch(newMatch.id);
            }
        }

        return potentialMatches;
    } catch (err) {
        console.error('AI Matching Error:', err);
    }
};

module.exports = { findMatches };
