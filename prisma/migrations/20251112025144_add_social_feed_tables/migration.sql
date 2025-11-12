-- CreateTable
CREATE TABLE `Posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('SONG_REQUEST', 'SONG_SHARE') NOT NULL,
    `status` ENUM('ACTIVE', 'RESOLVED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `authorId` INTEGER NOT NULL,
    `bandId` INTEGER NOT NULL,
    `sharedSongId` INTEGER NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `requestedSongTitle` VARCHAR(200) NULL,
    `requestedArtist` VARCHAR(150) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Posts_type_status_createdAt_idx`(`type`, `status`, `createdAt`),
    INDEX `Posts_authorId_idx`(`authorId`),
    INDEX `Posts_bandId_idx`(`bandId`),
    INDEX `Posts_sharedSongId_idx`(`sharedSongId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` TEXT NOT NULL,
    `postId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,
    `parentId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Comments_postId_createdAt_idx`(`postId`, `createdAt`),
    INDEX `Comments_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Blessings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Blessings_userId_idx`(`userId`),
    INDEX `Blessings_postId_idx`(`postId`),
    UNIQUE INDEX `Blessings_postId_userId_key`(`postId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SongCopies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `originalSongId` INTEGER NOT NULL,
    `copiedSongId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `targetBandId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SongCopies_copiedSongId_key`(`copiedSongId`),
    INDEX `SongCopies_postId_idx`(`postId`),
    INDEX `SongCopies_userId_idx`(`userId`),
    INDEX `SongCopies_targetBandId_idx`(`targetBandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Posts` ADD CONSTRAINT `Posts_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `Users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Posts` ADD CONSTRAINT `Posts_bandId_fkey` FOREIGN KEY (`bandId`) REFERENCES `Bands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Posts` ADD CONSTRAINT `Posts_sharedSongId_fkey` FOREIGN KEY (`sharedSongId`) REFERENCES `Songs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comments` ADD CONSTRAINT `Comments_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comments` ADD CONSTRAINT `Comments_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `Users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comments` ADD CONSTRAINT `Comments_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Blessings` ADD CONSTRAINT `Blessings_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Blessings` ADD CONSTRAINT `Blessings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SongCopies` ADD CONSTRAINT `SongCopies_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SongCopies` ADD CONSTRAINT `SongCopies_originalSongId_fkey` FOREIGN KEY (`originalSongId`) REFERENCES `Songs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SongCopies` ADD CONSTRAINT `SongCopies_copiedSongId_fkey` FOREIGN KEY (`copiedSongId`) REFERENCES `Songs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SongCopies` ADD CONSTRAINT `SongCopies_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SongCopies` ADD CONSTRAINT `SongCopies_targetBandId_fkey` FOREIGN KEY (`targetBandId`) REFERENCES `Bands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
