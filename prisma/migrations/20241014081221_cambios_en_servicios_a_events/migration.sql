/*
  Warnings:

  - You are about to drop the `services` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `servicesongs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `services` DROP FOREIGN KEY `Services_churchId_fkey`;

-- DropForeignKey
ALTER TABLE `servicesongs` DROP FOREIGN KEY `ServiceSongs_serviceId_fkey`;

-- DropForeignKey
ALTER TABLE `servicesongs` DROP FOREIGN KEY `ServiceSongs_songId_fkey`;

-- DropTable
DROP TABLE `services`;

-- DropTable
DROP TABLE `servicesongs`;

-- CreateTable
CREATE TABLE `Events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `Date` DATETIME(3) NOT NULL,
    `churchId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SongsEvents` (
    `serviceId` INTEGER NOT NULL,
    `songId` INTEGER NOT NULL,
    `transpose` INTEGER NOT NULL DEFAULT 0,
    `order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`serviceId`, `songId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Events` ADD CONSTRAINT `Events_churchId_fkey` FOREIGN KEY (`churchId`) REFERENCES `Churches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SongsEvents` ADD CONSTRAINT `SongsEvents_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SongsEvents` ADD CONSTRAINT `SongsEvents_songId_fkey` FOREIGN KEY (`songId`) REFERENCES `Songs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
