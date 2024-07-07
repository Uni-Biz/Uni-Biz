/*
  Warnings:

  - Added the required column `bio` to the `BusinessProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "bio" TEXT NOT NULL;
