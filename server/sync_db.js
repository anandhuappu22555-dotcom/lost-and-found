const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sync() {
    console.log('🔄 Checking database schema for originalImageUrl...');
    try {
        // Safe check for LostItem
        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='LostItem' AND column_name='originalImageUrl') THEN 
                    ALTER TABLE "LostItem" ADD COLUMN "originalImageUrl" TEXT; 
                    RAISE NOTICE 'Added originalImageUrl to LostItem';
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='FoundItem' AND column_name='originalImageUrl') THEN 
                    ALTER TABLE "FoundItem" ADD COLUMN "originalImageUrl" TEXT; 
                    RAISE NOTICE 'Added originalImageUrl to FoundItem';
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='FoundItem' AND column_name='imageVisibilityStatus') THEN 
                    ALTER TABLE "FoundItem" ADD COLUMN "imageVisibilityStatus" TEXT DEFAULT 'masked'; 
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Claim' AND column_name='claimProof') THEN 
                    ALTER TABLE "Claim" ADD COLUMN "claimProof" TEXT; 
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Claim' AND column_name='verificationAttempts') THEN 
                    ALTER TABLE "Claim" ADD COLUMN "verificationAttempts" INTEGER DEFAULT 0; 
                END IF;
            END $$;
        `);
        console.log('✅ Database schema sync check completed.');
    } catch (err) {
        console.error('⚠️ Database schema sync check encountered an issue (non-critical):', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

sync();
