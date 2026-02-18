-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "cloudfrontDistId" TEXT,
ADD COLUMN     "cloudfrontDomain" TEXT,
ADD COLUMN     "deployedAt" TIMESTAMP(3);
