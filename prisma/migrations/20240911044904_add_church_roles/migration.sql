/*
  Warnings:

  - You are about to drop the `_churchestousers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_churchestousers` DROP FOREIGN KEY `_ChurchesToUsers_A_fkey`;

-- DropForeignKey
ALTER TABLE `_churchestousers` DROP FOREIGN KEY `_ChurchesToUsers_B_fkey`;

-- AlterTable
ALTER TABLE `churches` ADD COLUMN `aniversary` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `birthdate` DATETIME(3) NULL;

-- DropTable
DROP TABLE `_churchestousers`;

-- CreateTable
CREATE TABLE `Memberships` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `churchId` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `memberSince` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Memberships_userId_churchId_key`(`userId`, `churchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChurchMemberRoles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `membershipId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,

    INDEX `ChurchMemberRoles_membershipId_idx`(`membershipId`),
    INDEX `ChurchMemberRoles_roleId_idx`(`roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChurchRoles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `ChurchRoles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Memberships` ADD CONSTRAINT `Memberships_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Memberships` ADD CONSTRAINT `Memberships_churchId_fkey` FOREIGN KEY (`churchId`) REFERENCES `Churches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChurchMemberRoles` ADD CONSTRAINT `ChurchMemberRoles_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `Memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChurchMemberRoles` ADD CONSTRAINT `ChurchMemberRoles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `ChurchRoles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
