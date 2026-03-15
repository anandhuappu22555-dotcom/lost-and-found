const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendLoginConfirmationEmail, sendPasswordResetEmail } = require('../utils/emailService');

const { body, validationResult } = require('express-validator');

// 1. Validation Middleware for Registration
const registerValidation = [
    body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Please provide a valid email')
        .custom(value => {
            const emailLower = value.toLowerCase();
            if (emailLower.includes('@gnail.') || emailLower.includes('@gmil.')) {
                throw new Error('Did you mean @gmail.com? Please check your email for typos.');
            }
            return true;
        }),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[@$!%*?&#+-_.,]/).withMessage('Password must contain at least one symbol')
];

// 2. Register Controller
router.post('/register', registerValidation, async (req, res) => {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    try {
        const { username, email, password } = req.body;

        // Ensure JWT_SECRET exists before proceeding
        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET is missing in environment variables');
            return res.status(500).json({ success: false, message: 'Server configuration error' });
        }

        // Duplicate Email Check (Phase 1.4)
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Password Hashing (Phase 1.3)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Database Insertion (Phase 1.2)
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                emailVerified: false,
                trustScore: {
                    create: { successfulReturns: 0, failedClaims: 0, reportsCount: 0, rating: 5.0 }
                }
            },
            select: { id: true, username: true, email: true, role: true } // Don't return password
        });

        // JWT Generation (Phase 1.5)
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Standard Success Response (Phase 3)
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user
        });

    } catch (err) {
        console.error('[DATABASE_ERROR]:', err.message);

        // Supabase/PgBouncer specific check (Phase 1.2)
        if (err.message.includes('Tenant or user not found') || err.message.includes('connection pool')) {
            return res.status(503).json({
                success: false,
                message: 'Database connection configuration error. Please ensure DATABASE_URL includes ?pgbouncer=true'
            });
        }

        res.status(500).json({
            success: false,
            message: 'An internal server error occurred during registration'
        });
    }
});

// Login - Direct email + password login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ success: false, message: 'Invalid email or password' });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ success: false, message: 'Invalid email or password' });

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error('[LOGIN_ERROR]:', err.message);
        if (err.message.includes('Tenant or user not found')) {
            return res.status(503).json({
                success: false,
                message: 'Database connection configuration error. Please ensure DATABASE_URL includes ?pgbouncer=true'
            });
        }
        res.status(500).json({ success: false, message: 'An internal error occurred' });
    }
});

// Forgot Password - Send Reset Link
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Standard practice: don't reveal if user exists
            return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { email },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: resetExpires
            }
        });

        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        await sendPasswordResetEmail(email, resetLink);

        res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error('Forgot Password Error:', err.message);
        if (err.message.includes('Tenant or user not found')) {
            return res.status(503).json({ error: 'Database connection error. Please ensure DATABASE_URL includes ?pgbouncer=true on Render.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Reset Password - Verify Token and Update
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { gt: new Date() }
            }
        });

        if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

        res.json({ message: 'Password has been reset successfully. You can now login.' });
    } catch (err) {
        console.error('Reset Password Error:', err.message);
        if (err.message.includes('Tenant or user not found')) {
            return res.status(503).json({ error: 'Database connection error. Please ensure DATABASE_URL includes ?pgbouncer=true on Render.' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
