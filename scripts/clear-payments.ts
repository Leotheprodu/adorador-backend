
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Poblar bandId para pagos existentes que no lo tienen
  const paymentsWithoutBandId = await prisma.paymentHistory.findMany({
    where: { bandId: null },
    include: {
      subscription: {
        select: { bandId: true }
      }
    }
  });

  console.log(`Found ${paymentsWithoutBandId.length} payments without bandId`);

  for (const payment of paymentsWithoutBandId) {
    await prisma.paymentHistory.update({
      where: { id: payment.id },
      data: { bandId: payment.subscription.bandId }
    });
    console.log(`Updated payment ${payment.id} with bandId ${payment.subscription.bandId}`);
  }

  console.log('Finished updating payments');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
