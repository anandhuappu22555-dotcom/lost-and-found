const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// 1. Environment Validation
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL', 'SMTP_HOST', 'EMAIL_USER', 'EMAIL_PASS'];
const missingVars = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ CRITICAL STARTUP ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// 2. Production Security Setup
const { setupSecurity, centralErrorHandler } = require('./middleware/security');
setupSecurity(app);

app.use(express.json());
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(require('morgan')(logFormat)); // Structured logging Phase 4.5
app.use('/uploads', express.static('uploads'));

app.get("/", (req, res) => {
  res.send("API RUNNING");
});

// Public Stats Endpoint
app.get("/api/stats", async (req, res) => {
  try {
    const [lost, found, completed] = await Promise.all([
      prisma.lostItem.count({ where: { status: 'active' } }),
      prisma.foundItem.count({ where: { status: 'active' } }),
      prisma.claim.count({ where: { status: 'completed' } })
    ]);
    res.json({ lost, found, completed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Item Routes
const itemRoutes = require('./routes/items');
app.use('/api/items', itemRoutes);

// Match Routes
const matchRoutes = require('./routes/matches');
app.use('/api/matches', matchRoutes);

// Claim Routes
const claimRoutes = require('./routes/claims');
app.use('/api/claims', claimRoutes);

// Admin Routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Image Access Routes
const imageRoutes = require('./routes/images');
app.use('/api/images', imageRoutes);

// Chat Routes
const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

// Notification Routes
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

// 3. Central Error Handling
app.use(centralErrorHandler);

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ DATABASE CONNECTED (Localhost)');
    // Only listen if not running on Vercel
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
        app.listen(PORT, () => {
          console.log(`🚀 SERVER RUNNING ON PORT: ${PORT}`);
        });
    }
  } catch (err) {
    console.error('❌ DATABASE FAILURE:', err.message);
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
        app.listen(PORT, () => {
          console.log(`⚠️  SERVER STARTED (Port ${PORT})`);
        });
    }
  }
};

startServer();

// Export the app for Vercel serverless functions
module.exports = app;
