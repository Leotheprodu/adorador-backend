/*
  Warnings:

  - Made the column `createdBy` on table `bands` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `bands` DROP FOREIGN KEY `Bands_createdBy_fkey`;

-- AlterTable
ALTER TABLE `bands` MODIFY `createdBy` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Bands` ADD CONSTRAINT `Bands_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
