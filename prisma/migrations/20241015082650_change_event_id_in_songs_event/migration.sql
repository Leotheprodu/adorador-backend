/*
  Warnings:

  - The primary key for the `songsevents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `serviceId` on the `songsevents` table. All the data in the column will be lost.
  - Added the required column `eventId` to the `SongsEvents` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `songsevents` DROP FOREIGN KEY `SongsEvents_serviceId_fkey`;

-- AlterTable
ALTER TABLE `songsevents` DROP PRIMARY KEY,
    DROP COLUMN `serviceId`,
    ADD COLUMN `eventId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`eventId`, `songId`);

-- AddForeignKey
ALTER TABLE `SongsEvents` ADD CONSTRAINT `SongsEvents_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
