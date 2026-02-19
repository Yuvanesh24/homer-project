import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@homer.org' },
    update: {},
    create: {
      email: 'admin@homer.org',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  });

  console.log('Created admin user:', admin.email);

  const therapist = await prisma.user.upsert({
    where: { email: 'therapist@homer.org' },
    update: {},
    create: {
      email: 'therapist@homer.org',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'therapist',
    },
  });

  console.log('Created therapist user:', therapist.email);

  const deviceSets = [
    {
      setNumber: 1,
      marsDeviceId: 'MARS-001',
      plutoDeviceId: 'PLUTO-001',
      laptopNumber: 'LAP-001',
      modemSerial: 'MODEM-001',
      actigraphLeftSerial: 'ACT-L-001',
      actigraphRightSerial: 'ACT-R-001',
      status: 'available',
    },
    {
      setNumber: 2,
      marsDeviceId: 'MARS-002',
      plutoDeviceId: 'PLUTO-002',
      laptopNumber: 'LAP-002',
      modemSerial: 'MODEM-002',
      actigraphLeftSerial: 'ACT-L-002',
      actigraphRightSerial: 'ACT-R-002',
      status: 'available',
    },
    {
      setNumber: 3,
      marsDeviceId: 'MARS-003',
      plutoDeviceId: 'PLUTO-003',
      laptopNumber: 'LAP-003',
      modemSerial: 'MODEM-003',
      actigraphLeftSerial: 'ACT-L-003',
      actigraphRightSerial: 'ACT-R-003',
      status: 'available',
    },
    {
      setNumber: 4,
      marsDeviceId: 'MARS-004',
      plutoDeviceId: 'PLUTO-004',
      laptopNumber: 'LAP-004',
      modemSerial: 'MODEM-004',
      actigraphLeftSerial: 'ACT-L-004',
      actigraphRightSerial: 'ACT-R-004',
      status: 'available',
    },
    {
      setNumber: 5,
      marsDeviceId: 'MARS-005',
      plutoDeviceId: 'PLUTO-005',
      laptopNumber: 'LAP-005',
      modemSerial: 'MODEM-005',
      actigraphLeftSerial: 'ACT-L-005',
      actigraphRightSerial: 'ACT-R-005',
      status: 'available',
    },
  ];

  for (const device of deviceSets) {
    await prisma.deviceSet.upsert({
      where: { setNumber: device.setNumber },
      update: {},
      create: device,
    });
  }

  console.log('Created 5 device sets');

  const rechargeDate = new Date();
  const expiryDate = addDays(rechargeDate, 180);

  const simCards = [
    {
      simNumber: '8197646397',
      provider: 'airtel',
      linkedDeviceSetId: (await prisma.deviceSet.findUnique({ where: { setNumber: 1 } }))?.id,
      rechargeDate,
      rechargeDurationDays: 180,
      expiryDate,
    },
    {
      simNumber: '7204686397',
      provider: 'airtel',
      linkedDeviceSetId: (await prisma.deviceSet.findUnique({ where: { setNumber: 3 } }))?.id,
      rechargeDate,
      rechargeDurationDays: 180,
      expiryDate,
    },
    {
      simNumber: '8296391397',
      provider: 'airtel',
      linkedDeviceSetId: (await prisma.deviceSet.findUnique({ where: { setNumber: 5 } }))?.id,
      rechargeDate,
      rechargeDurationDays: 180,
      expiryDate,
    },
  ];

  for (const sim of simCards) {
    const existing = await prisma.simCard.findUnique({
      where: { simNumber: sim.simNumber },
    });
    
    if (!existing) {
      await prisma.simCard.create({
        data: sim,
      });
    }
  }

  console.log('Created 3 Airtel SIM cards');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
