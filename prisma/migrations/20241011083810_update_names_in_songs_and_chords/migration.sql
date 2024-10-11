/*
  Warnings:

  - You are about to drop the column `youtube_link` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `chord_quality` on the `songs_chords` table. All the data in the column will be lost.
  - You are about to drop the column `root_note` on the `songs_chords` table. All the data in the column will be lost.
  - You are about to drop the column `slash_chord` on the `songs_chords` table. All the data in the column will be lost.
  - You are about to drop the column `slash_quality` on the `songs_chords` table. All the data in the column will be lost.
  - Added the required column `rootNote` to the `Songs_Chords` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `songs` DROP COLUMN `youtube_link`,
    ADD COLUMN `youtubeLink` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `songs_chords` DROP COLUMN `chord_quality`,
    DROP COLUMN `root_note`,
    DROP COLUMN `slash_chord`,
    DROP COLUMN `slash_quality`,
    ADD COLUMN `chordQuality` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `rootNote` VARCHAR(191) NOT NULL,
    ADD COLUMN `slashChord` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `slashQuality` VARCHAR(191) NOT NULL DEFAULT '';
