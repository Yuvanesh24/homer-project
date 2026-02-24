import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { addDays } from 'date-fns';

const router = Router();

router.get('/stats', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = addDays(today, 1);
    const threeDaysFromNow = addDays(today, 3);

    const [
      totalPatients,
      activePatients,
      droppedOutPatients,
      completedPatients,
      todayReminders,
      overdueReminders,
      devicesInUse,
      interventionCount,
      controlCount,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.patient.count({ where: { status: 'active' } }),
      prisma.patient.count({ where: { status: 'dropped_out' } }),
      prisma.patient.count({ where: { status: 'completed' } }),
      prisma.reminder.count({
        where: {
          isCompleted: false,
          dueDate: { gte: today, lt: tomorrow },
        },
      }),
      prisma.reminder.count({
        where: {
          isCompleted: false,
          dueDate: { lt: today },
        },
      }),
      prisma.deviceSet.count({ where: { status: 'in_use' } }),
      prisma.patient.count({ where: { groupType: 'intervention' } }),
      prisma.patient.count({ where: { groupType: 'control' } }),
    ]);

    res.json({
      totalPatients,
      activePatients,
      droppedOutPatients,
      completedPatients,
      todayReminders,
      overdueReminders,
      devicesInUse,
      interventionCount,
      controlCount,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/actions', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = addDays(today, 1);

    const [upcomingEvents, overdueEvents, expiringSims] = await Promise.all([
      prisma.studyEvent.findMany({
        where: {
          status: 'pending',
          scheduledDate: { gte: today, lt: addDays(today, 3) },
          patient: { status: 'active' },
        },
        orderBy: { scheduledDate: 'asc' },
        include: {
          patient: { select: { patientId: true, groupType: true } },
        },
        take: 20,
      }),
      prisma.studyEvent.findMany({
        where: {
          status: 'pending',
          scheduledDate: { lt: today },
          patient: { status: 'active' },
        },
        orderBy: { scheduledDate: 'asc' },
        include: {
          patient: { select: { patientId: true, groupType: true } },
        },
        take: 20,
      }),
      prisma.simCard.findMany({
        where: {
          isActive: true,
          expiryDate: { lte: addDays(today, 2), gte: today },
        },
        select: {
          id: true,
          simNumber: true,
          modemNumber: true,
          provider: true,
          expiryDate: true,
        },
      }),
    ]);

    res.json({
      upcomingEvents: upcomingEvents.map((e) => ({
        ...e,
        isOverdue: false,
      })),
      overdueEvents: overdueEvents.map((e) => ({
        ...e,
        isOverdue: true,
      })),
      expiringSims,
    });
  } catch (error) {
    console.error('Get dashboard actions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
