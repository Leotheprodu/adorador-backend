-- AlterTable
ALTER TABLE `servicesongs` MODIFY `transpose` INTEGER NOT NULL DEFAULT 0,
    MODIFY `order` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `songs` MODIFY `youtube_link` VARCHAR(191) NULL,
    MODIFY `key` VARCHAR(191) NULL,
    MODIFY `tempo` VARCHAR(191) NULL,
    MODIFY `artist` VARCHAR(191) NULL;
