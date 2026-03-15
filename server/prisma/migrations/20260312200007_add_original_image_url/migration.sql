/*
  Warnings:

  - You are about to drop the column `failedAttempts` on the `Claim` table. All the data in the column will be lost.
  - You are about to drop the column `proofUrl` on the `Claim` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Claim" DROP COLUMN "failedAttempts",
DROP COLUMN "proofUrl",
ADD COLUMN     "claimProof" TEXT,
ADD COLUMN     "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'verification_pending';

-- AlterTable
ALTER TABLE "FoundItem" ADD COLUMN     "imageVisibilityStatus" TEXT NOT NULL DEFAULT 'masked',
ALTER COLUMN "status" SET DEFAULT 'active';

-- AlterTable
ALTER TABLE "LostItem" ADD COLUMN     "originalImageUrl" TEXT,
ALTER COLUMN "status" SET DEFAULT 'active';

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
