-- CreateTable
CREATE TABLE `BandInvitations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bandId` INTEGER NOT NULL,
    `invitedUserId` INTEGER NOT NULL,
    `invitedBy` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `BandInvitations_invitedUserId_status_idx`(`invitedUserId`, `status`),
    INDEX `BandInvitations_bandId_idx`(`bandId`),
    UNIQUE INDEX `BandInvitations_bandId_invitedUserId_status_key`(`bandId`, `invitedUserId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BandInvitations` ADD CONSTRAINT `BandInvitations_bandId_fkey` FOREIGN KEY (`bandId`) REFERENCES `Bands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BandInvitations` ADD CONSTRAINT `BandInvitations_invitedUserId_fkey` FOREIGN KEY (`invitedUserId`) REFERENCES `Users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BandInvitations` ADD CONSTRAINT `BandInvitations_invitedBy_fkey` FOREIGN KEY (`invitedBy`) REFERENCES `Users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
