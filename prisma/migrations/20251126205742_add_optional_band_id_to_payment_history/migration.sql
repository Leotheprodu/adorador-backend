-- AlterTable
ALTER TABLE `paymenthistory` ADD COLUMN `bandId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `PaymentHistory` ADD CONSTRAINT `PaymentHistory_bandId_fkey` FOREIGN KEY (`bandId`) REFERENCES `Bands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
