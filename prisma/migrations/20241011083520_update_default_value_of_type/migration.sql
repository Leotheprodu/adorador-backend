/*
  Warnings:

  - You are about to drop the column `type` on the `songs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `songs` DROP COLUMN `type`,
    ADD COLUMN `songType` VARCHAR(191) NOT NULL DEFAULT 'worship';
