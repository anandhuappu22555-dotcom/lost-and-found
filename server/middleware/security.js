const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

const setupSecurity = (app) => {
    // 1. Helmet Security Headers
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // 2. CORS - Production Hardened (Phase 2.1)
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:5173',
        'https://lost-and-found-sym-frontend.vercel.app'
    ].filter(Boolean);

    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
                callback(null, true);
            } else {
                callback(new Error('Blocked by Production CORS Policy'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // 3. Rate Limiting (Phase 4.2)
    const generalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 500, // general API limit
        message: { success: false, message: 'Too many requests' }
    });
    app.use('/api/', generalLimiter);

    // Dedicated Auth Limiter (Prevents brute force/abuse)
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20, // 20 attempts per 15 min
        message: { success: false, message: 'Too many authentication attempts. Please wait.' }
    });
    app.use('/api/auth/', authLimiter);

    // 4. Data Sanitization (Phase 4.3)
    app.use(xss());
    app.use(hpp());

    console.log('🛡️  PRODUCTION SECURITY MIDDLEWARE INITIALIZED');
};

const centralErrorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const isProd = process.env.NODE_ENV === 'production';

    // Structured Error Response (Phase 3)
    res.status(status).json({
        success: false,
        message: isProd ? 'A system error occurred. Please try again later.' : err.message,
        status: status
    });
};

module.exports = { setupSecurity, centralErrorHandler };
