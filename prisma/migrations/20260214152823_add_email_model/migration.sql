-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "zohoAccountId" TEXT,
    "domainId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Email_address_key" ON "Email"("address");

-- CreateIndex
CREATE INDEX "Email_domainId_idx" ON "Email"("domainId");

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
