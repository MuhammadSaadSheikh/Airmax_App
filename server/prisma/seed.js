const {
  BillingPeriod,
  PackageStatus,
  PrismaClient,
} = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.package.upsert({
    where: { name: 'AIRMAX Foundation 25' },
    update: {
      description: 'Foundation catalogue package',
      speedMbps: 25,
      price: '2500.00',
      billingPeriod: BillingPeriod.MONTHLY,
      features: ['25 Mbps service'],
      status: PackageStatus.ACTIVE,
    },
    create: {
      id: '10000000-0000-4000-8000-000000000001',
      name: 'AIRMAX Foundation 25',
      description: 'Foundation catalogue package',
      speedMbps: 25,
      price: '2500.00',
      billingPeriod: BillingPeriod.MONTHLY,
      features: ['25 Mbps service'],
      status: PackageStatus.ACTIVE,
    },
  });

  await prisma.serviceArea.upsert({
    where: { city_name: { city: 'Foundation', name: 'Central' } },
    update: { active: true },
    create: {
      id: '20000000-0000-4000-8000-000000000001',
      city: 'Foundation',
      name: 'Central',
      active: true,
    },
  });

  for (const [id, name, description] of [
    [
      '30000000-0000-4000-8000-000000000001',
      'Fiber',
      'Fiber installation and repair',
    ],
    [
      '30000000-0000-4000-8000-000000000002',
      'Wireless',
      'Wireless diagnostics',
    ],
  ]) {
    await prisma.skill.upsert({
      where: { name },
      update: { description, active: true },
      create: { id, name, description, active: true },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async error => {
    await prisma.$disconnect();
    console.error(error);
    process.exitCode = 1;
  });
