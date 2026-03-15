/*
  Warnings:

  - You are about to drop the column `otpExpiresAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `otpHash` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "otpExpiresAt",
DROP COLUMN "otpHash";

-- CreateTable
CREATE TABLE "LoginSession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfirmationToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfirmationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfirmationToken_token_key" ON "ConfirmationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ConfirmationToken_sessionId_key" ON "ConfirmationToken"("sessionId");

-- AddForeignKey
ALTER TABLE "LoginSession" ADD CONSTRAINT "LoginSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfirmationToken" ADD CONSTRAINT "ConfirmationToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LoginSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
