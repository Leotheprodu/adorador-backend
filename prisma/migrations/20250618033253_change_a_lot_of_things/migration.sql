/*
  Warnings:

  - You are about to drop the column `churchId` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `churchId` on the `songs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `events` DROP FOREIGN KEY `Events_churchId_fkey`;

-- DropForeignKey
ALTER TABLE `events` DROP FOREIGN KEY `Events_eventManagerId_fkey`;

-- DropForeignKey
ALTER TABLE `songs` DROP FOREIGN KEY `Songs_churchId_fkey`;

-- AlterTable
ALTER TABLE `events` DROP COLUMN `churchId`,
    ADD COLUMN `bandId` INTEGER NULL;

-- AlterTable
ALTER TABLE `songs` DROP COLUMN `churchId`,
    ADD COLUMN `bandId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Bands` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Bands_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MembersofBands` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `bandId` INTEGER NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isEventManager` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MembersofBands` ADD CONSTRAINT `MembersofBands_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MembersofBands` ADD CONSTRAINT `MembersofBands_bandId_fkey` FOREIGN KEY (`bandId`) REFERENCES `Bands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Events` ADD CONSTRAINT `Events_bandId_fkey` FOREIGN KEY (`bandId`) REFERENCES `Bands`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Songs` ADD CONSTRAINT `Songs_bandId_fkey` FOREIGN KEY (`bandId`) REFERENCES `Bands`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
