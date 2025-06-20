/*
  Warnings:

  - Made the column `bandId` on table `events` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bandId` on table `songs` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `events` DROP FOREIGN KEY `Events_bandId_fkey`;

-- DropForeignKey
ALTER TABLE `songs` DROP FOREIGN KEY `Songs_bandId_fkey`;

-- AlterTable
ALTER TABLE `events` MODIFY `bandId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `songs` MODIFY `bandId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Events` ADD CONSTRAINT `Events_bandId_fkey` FOREIGN KEY (`bandId`) REFERENCES `Bands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Songs` ADD CONSTRAINT `Songs_bandId_fkey` FOREIGN KEY (`bandId`) REFERENCES `Bands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
