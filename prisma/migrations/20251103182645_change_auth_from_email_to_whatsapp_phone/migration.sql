/*
  Warnings:

  - You are about to drop the column `userEmail` on the `temporal_token_pool` table. All the data in the column will be lost.
  - Added the required column `userPhone` to the `Temporal_token_pool` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `users` required. This step will fail if there are existing NULL values in that column.

*/

-- Primero, limpiar tokens temporales existentes para evitar conflictos
DELETE FROM `temporal_token_pool`;

-- Asegurarse de que todos los usuarios tengan un teléfono (agregar uno temporal si no existe)
UPDATE `users` SET `phone` = CONCAT('temp_', `id`) WHERE `phone` IS NULL;

-- DropForeignKey
ALTER TABLE `temporal_token_pool` DROP FOREIGN KEY `Temporal_token_pool_userEmail_fkey`;

-- DropIndex
DROP INDEX `Users_email_key` ON `users`;

-- AlterTable
ALTER TABLE `temporal_token_pool` DROP COLUMN `userEmail`,
    ADD COLUMN `userPhone` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `email` VARCHAR(191) NULL,
    MODIFY `phone` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Temporal_token_pool` ADD CONSTRAINT `Temporal_token_pool_userPhone_fkey` FOREIGN KEY (`userPhone`) REFERENCES `Users`(`phone`) ON DELETE RESTRICT ON UPDATE CASCADE;
