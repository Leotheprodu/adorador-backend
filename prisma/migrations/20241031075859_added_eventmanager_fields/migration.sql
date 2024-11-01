-- AlterTable
ALTER TABLE `events` ADD COLUMN `eventManagerId` INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE `Events` ADD CONSTRAINT `Events_eventManagerId_fkey` FOREIGN KEY (`eventManagerId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
