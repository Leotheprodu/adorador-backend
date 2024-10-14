/*
  Warnings:

  - You are about to drop the column `Date` on the `events` table. All the data in the column will be lost.
  - Added the required column `date` to the `Events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `events` DROP COLUMN `Date`,
    ADD COLUMN `date` DATETIME(3) NOT NULL;
