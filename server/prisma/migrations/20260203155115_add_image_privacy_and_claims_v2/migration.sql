-- AlterTable
ALTER TABLE "Claim" ADD COLUMN     "failedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "proofUrl" TEXT;

-- AlterTable
ALTER TABLE "FoundItem" ADD COLUMN     "originalImageUrl" TEXT;
