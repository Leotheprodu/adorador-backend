-- AlterTable
ALTER TABLE `bands` ADD COLUMN `createdBy` INTEGER NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedBy` INTEGER NULL;

-- CreateTable
CREATE TABLE `SubscriptionPlans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('TRIAL', 'BASIC', 'PROFESSIONAL', 'PREMIUM') NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `maxMembers` INTEGER NOT NULL,
    `maxSongs` INTEGER NOT NULL,
    `maxEventsPerMonth` INTEGER NOT NULL,
    `maxPeoplePerEvent` INTEGER NOT NULL,
    `durationDays` INTEGER NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SubscriptionPlans_name_key`(`name`),
    UNIQUE INDEX `SubscriptionPlans_type_key`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BandSubscriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bandId` INTEGER NOT NULL,
    `planId` INTEGER NOT NULL,
    `status` ENUM('TRIAL', 'ACTIVE', 'PAYMENT_PENDING', 'GRACE_PERIOD', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'TRIAL',
    `trialStartDate` DATETIME(3) NULL,
    `trialEndDate` DATETIME(3) NULL,
    `currentPeriodStart` DATETIME(3) NOT NULL,
    `currentPeriodEnd` DATETIME(3) NOT NULL,
    `gracePeriodEnd` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BandSubscriptions_bandId_key`(`bandId`),
    INDEX `BandSubscriptions_bandId_status_idx`(`bandId`, `status`),
    INDEX `BandSubscriptions_currentPeriodEnd_idx`(`currentPeriodEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subscriptionId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `method` ENUM('PAYPAL', 'SINPE_MOVIL', 'BANK_TRANSFER') NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `paidByUserId` INTEGER NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `proofImageUrl` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `approvedByUserId` INTEGER NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentHistory_subscriptionId_idx`(`subscriptionId`),
    INDEX `PaymentHistory_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrialHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `userPhone` VARCHAR(191) NOT NULL,
    `bandId` INTEGER NOT NULL,
    `trialStartDate` DATETIME(3) NOT NULL,
    `trialEndDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TrialHistory_userPhone_idx`(`userPhone`),
    INDEX `TrialHistory_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Bands_deletedAt_idx` ON `Bands`(`deletedAt`);

-- CreateIndex
CREATE INDEX `Bands_createdBy_deletedAt_idx` ON `Bands`(`createdBy`, `deletedAt`);

-- AddForeignKey
ALTER TABLE `Bands` ADD CONSTRAINT `Bands_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `Users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BandSubscriptions` ADD CONSTRAINT `BandSubscriptions_bandId_fkey` FOREIGN KEY (`bandId`) REFERENCES `Bands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BandSubscriptions` ADD CONSTRAINT `BandSubscriptions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `SubscriptionPlans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentHistory` ADD CONSTRAINT `PaymentHistory_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `BandSubscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentHistory` ADD CONSTRAINT `PaymentHistory_paidByUserId_fkey` FOREIGN KEY (`paidByUserId`) REFERENCES `Users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentHistory` ADD CONSTRAINT `PaymentHistory_approvedByUserId_fkey` FOREIGN KEY (`approvedByUserId`) REFERENCES `Users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrialHistory` ADD CONSTRAINT `TrialHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrialHistory` ADD CONSTRAINT `TrialHistory_bandId_fkey` FOREIGN KEY (`bandId`) REFERENCES `Bands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
