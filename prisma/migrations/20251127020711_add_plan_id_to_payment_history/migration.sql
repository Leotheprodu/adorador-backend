-- AlterTable
ALTER TABLE `paymenthistory` ADD COLUMN `planId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `PaymentHistory` ADD CONSTRAINT `PaymentHistory_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `SubscriptionPlans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
