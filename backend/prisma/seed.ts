import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPasswordHash = await bcrypt.hash('Yuvan@123', 12);
  const therapistPasswordHash = await bcrypt.hash('Nidhi@123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'yuvanesh@homer.org' },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: 'yuvanesh@homer.org',
      passwordHash: adminPasswordHash,
      firstName: 'Yuvanesh',
      lastName: '',
      role: 'admin',
    },
  });

  console.log('Created admin user:', admin.email);

  const therapist = await prisma.user.upsert({
    where: { email: 'nidhi@homer.org' },
    update: { passwordHash: therapistPasswordHash },
    create: {
      email: 'nidhi@homer.org',
      passwordHash: therapistPasswordHash,
      firstName: 'Nidhi',
      lastName: 'Mislankar',
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
      status: 'available',
    },
    {
      setNumber: 2,
      marsDeviceId: 'MARS-002',
      plutoDeviceId: 'PLUTO-002',
      laptopNumber: 'LAP-002',
      modemSerial: 'MODEM-002',
      status: 'available',
    },
    {
      setNumber: 3,
      marsDeviceId: 'MARS-003',
      plutoDeviceId: 'PLUTO-003',
      laptopNumber: 'LAP-003',
      modemSerial: 'MODEM-003',
      status: 'available',
    },
    {
      setNumber: 4,
      marsDeviceId: 'MARS-004',
      plutoDeviceId: 'PLUTO-004',
      laptopNumber: 'LAP-004',
      modemSerial: 'MODEM-004',
      status: 'available',
    },
    {
      setNumber: 5,
      marsDeviceId: 'MARS-005',
      plutoDeviceId: 'PLUTO-005',
      laptopNumber: 'LAP-005',
      modemSerial: 'MODEM-005',
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

  const watches = [
    { name: 'Pair 1', leftSerial: 'A0', rightSerial: 'A1', isBackup: false },
    { name: 'Pair 2', leftSerial: 'A2', rightSerial: 'A3', isBackup: false },
    { name: 'Pair 3', leftSerial: 'A4', rightSerial: 'A5', isBackup: false },
    { name: 'Pair 4', leftSerial: 'A6', rightSerial: 'A7', isBackup: false },
    { name: 'Pair 5', leftSerial: 'A8', rightSerial: 'A9', isBackup: false },
    { name: 'Backup 1', leftSerial: 'B0', rightSerial: 'B1', isBackup: true },
    { name: 'Backup 2', leftSerial: 'B2', rightSerial: 'B3', isBackup: true },
  ];

  for (const watch of watches) {
    await prisma.actigraphWatch.upsert({
      where: { name: watch.name },
      update: {},
      create: watch,
    });
  }

  console.log('Created 7 watch pairs (5 normal + 2 backup)');

  const rechargeDate = new Date();
  const expiryDate = addDays(rechargeDate, 180);

  const simCards = [
    {
      simNumber: '8197646397',
      modemNumber: 'MODEM-001',
      provider: 'airtel',
      linkedDeviceSetId: (await prisma.deviceSet.findUnique({ where: { setNumber: 1 } }))?.id,
      rechargeDate,
      rechargeDurationDays: 180,
      expiryDate,
    },
    {
      simNumber: '7204686397',
      modemNumber: 'MODEM-003',
      provider: 'airtel',
      linkedDeviceSetId: (await prisma.deviceSet.findUnique({ where: { setNumber: 3 } }))?.id,
      rechargeDate,
      rechargeDurationDays: 180,
      expiryDate,
    },
    {
      simNumber: '8296391397',
      modemNumber: 'MODEM-005',
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
