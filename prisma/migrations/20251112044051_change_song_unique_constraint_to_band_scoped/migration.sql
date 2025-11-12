/*
  Warnings:

  - A unique constraint covering the columns `[title,bandId]` on the table `Songs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Songs_title_key` ON `Songs`;

-- CreateIndex
CREATE UNIQUE INDEX `Songs_title_bandId_key` ON `Songs`(`title`, `bandId`);
