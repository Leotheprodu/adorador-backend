-- AlterTable
ALTER TABLE `Comments` ADD COLUMN `sharedSongId` INTEGER NULL;

-- CreateTable
CREATE TABLE `CommentBlessings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `commentId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CommentBlessings_userId_idx`(`userId`),
    INDEX `CommentBlessings_commentId_idx`(`commentId`),
    UNIQUE INDEX `CommentBlessings_commentId_userId_key`(`commentId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Comments_sharedSongId_idx` ON `Comments`(`sharedSongId`);

-- AddForeignKey
ALTER TABLE `Comments` ADD CONSTRAINT `Comments_sharedSongId_fkey` FOREIGN KEY (`sharedSongId`) REFERENCES `Songs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentBlessings` ADD CONSTRAINT `CommentBlessings_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `Comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentBlessings` ADD CONSTRAINT `CommentBlessings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
