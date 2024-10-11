/*
  Warnings:

  - You are about to drop the `songs_structure` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `songs_lyrics` DROP FOREIGN KEY `Songs_lyrics_structureId_fkey`;

-- DropTable
DROP TABLE `songs_structure`;

-- CreateTable
CREATE TABLE `Songs_Structures` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Songs_Structures_title_key`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Songs_lyrics` ADD CONSTRAINT `Songs_lyrics_structureId_fkey` FOREIGN KEY (`structureId`) REFERENCES `Songs_Structures`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
