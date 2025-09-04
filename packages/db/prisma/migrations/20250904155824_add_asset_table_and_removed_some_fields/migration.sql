/*
  Warnings:

  - You are about to drop the column `status` on the `ClosedOrder` table. All the data in the column will be lost.
  - You are about to drop the column `symbol` on the `ClosedOrder` table. All the data in the column will be lost.
  - You are about to drop the column `balance` on the `User` table. All the data in the column will be lost.
  - Added the required column `assetId` to the `ClosedOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leverage` to the `ClosedOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ClosedOrder" DROP COLUMN "status",
DROP COLUMN "symbol",
ADD COLUMN     "assetId" TEXT NOT NULL,
ADD COLUMN     "leverage" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "balance";

-- CreateTable
CREATE TABLE "public"."Asset" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "decimals" INTEGER NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_symbol_key" ON "public"."Asset"("symbol");

-- AddForeignKey
ALTER TABLE "public"."ClosedOrder" ADD CONSTRAINT "ClosedOrder_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
