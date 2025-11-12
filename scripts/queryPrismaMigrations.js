const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const crypto = require('crypto');

async function main() {
  const migName = '20251112072947_add_song_sharing_and_blessings_to_comments';
  const migPath = `prisma/migrations/${migName}/migration.sql`;

  // Compute SHA256 of current migration.sql file
  const content = fs.readFileSync(migPath, 'utf8');
  const newChecksum = crypto
    .createHash('sha256')
    .update(content, 'utf8')
    .digest('hex');

  console.log('Current file checksum:', newChecksum);

  // Get current DB record
  const rowsBefore =
    await prisma.$queryRaw`SELECT migration_name, checksum, applied_steps_count, finished_at FROM _prisma_migrations WHERE migration_name = ${migName};`;
  console.log(
    '\nBefore update:',
    JSON.stringify(
      rowsBefore,
      (_k, v) => (typeof v === 'bigint' ? v.toString() : v),
      2,
    ),
  );

  // Update checksum
  await prisma.$executeRaw`UPDATE _prisma_migrations SET checksum = ${newChecksum} WHERE migration_name = ${migName};`;
  console.log('\n✅ Checksum updated in database');

  // Verify
  const rowsAfter =
    await prisma.$queryRaw`SELECT migration_name, checksum, applied_steps_count, finished_at FROM _prisma_migrations WHERE migration_name = ${migName};`;
  console.log(
    '\nAfter update:',
    JSON.stringify(
      rowsAfter,
      (_k, v) => (typeof v === 'bigint' ? v.toString() : v),
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
