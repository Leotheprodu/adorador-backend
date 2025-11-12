-- AlterTable
ALTER TABLE `songcopies` ADD COLUMN `commentId` INTEGER NULL,
    MODIFY `postId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `SongCopies_commentId_idx` ON `SongCopies`(`commentId`);

-- AddForeignKey
ALTER TABLE `SongCopies` ADD CONSTRAINT `SongCopies_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `Comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
