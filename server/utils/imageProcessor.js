const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOADS_BASE = path.join(__dirname, '../uploads/originals');

/**
 * Takes an ABSOLUTE path to the uploaded file.
 * Returns the absolute path of the masked output file.
 */
const generateMaskedImage = async (absoluteInputPath) => {
    const fileName = path.basename(absoluteInputPath);
    const maskedFileName = `masked_${fileName}`;
    const maskedAbsPath = path.join(UPLOADS_BASE, maskedFileName);

    await sharp(absoluteInputPath)
        .blur(20)
        .toFile(maskedAbsPath);

    return `uploads/originals/${maskedFileName}`;
};

const ENCRYPTION_KEY = Buffer.from(
    (process.env.IMAGE_ENCRYPTION_KEY || 'default_32_byte_key_0123456789012').slice(0, 32),
    'utf8'
);
const IV_LENGTH = 16;

/**
 * Encrypts a file synchronously (reads it fully first, then writes).
 */
const encryptFile = (inputPath, outputPath) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    // Read entirely before writing to avoid race conditions
    const data = fs.readFileSync(inputPath);
    const encrypted = Buffer.concat([iv, cipher.update(data), cipher.final()]);
    fs.writeFileSync(outputPath, encrypted);
};

const decryptFile = (inputPath, res) => {
    try {
        const data = fs.readFileSync(inputPath);
        const iv = data.slice(0, IV_LENGTH);
        const encrypted = data.slice(IV_LENGTH);
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        res.end(decrypted);
    } catch (err) {
        console.error('Decrypt error:', err.message);
        res.status(500).json({ error: 'Could not decrypt image' });
    }
};

module.exports = { generateMaskedImage, encryptFile, decryptFile };
