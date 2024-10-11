-- CreateTable
CREATE TABLE `ServiceSongs` (
    `serviceId` INTEGER NOT NULL,
    `songId` INTEGER NOT NULL,
    `transpose` INTEGER NOT NULL,
    `order` INTEGER NOT NULL,

    PRIMARY KEY (`serviceId`, `songId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ServiceSongs` ADD CONSTRAINT `ServiceSongs_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceSongs` ADD CONSTRAINT `ServiceSongs_songId_fkey` FOREIGN KEY (`songId`) REFERENCES `Songs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
