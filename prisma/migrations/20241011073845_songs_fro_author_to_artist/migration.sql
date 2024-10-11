/*
  Warnings:

  - You are about to drop the column `author` on the `songs` table. All the data in the column will be lost.
  - Added the required column `artist` to the `Songs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `songs` DROP COLUMN `author`,
    ADD COLUMN `artist` VARCHAR(191) NOT NULL;
