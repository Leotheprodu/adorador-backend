-- DropIndex
DROP INDEX `BandInvitations_bandId_invitedUserId_status_key` ON `bandinvitations`;

-- CreateIndex
CREATE INDEX `BandInvitations_bandId_invitedUserId_status_idx` ON `BandInvitations`(`bandId`, `invitedUserId`, `status`);
