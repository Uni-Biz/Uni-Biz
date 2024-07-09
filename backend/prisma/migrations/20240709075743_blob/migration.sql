/*
  Warnings:

  - The `logo` column on the `BusinessProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "BusinessProfile" DROP COLUMN "logo",
ADD COLUMN     "logo" BYTEA;
