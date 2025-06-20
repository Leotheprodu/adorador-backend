/*
  Warnings:

  - You are about to drop the column `eventManagerId` on the `events` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Events_eventManagerId_fkey` ON `events`;

-- AlterTable
ALTER TABLE `events` DROP COLUMN `eventManagerId`;
