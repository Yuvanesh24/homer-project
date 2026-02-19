import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { addDays } from 'date-fns';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { patientId, reminderType, isCompleted } = req.query;
    const where: any = { isCompleted: isCompleted === 'true' };
    if (patientId) where.patientId = patientId;
    if (reminderType) where.reminderType = reminderType;

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        patient: { select: { patientId: true, status: true } },
      },
    });

    res.json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/today', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = addDays(today, 1);

    const reminders = await prisma.reminder.findMany({
      where: {
        isCompleted: false,
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        patient: { select: { patientId: true, status: true } },
      },
    });

    res.json(reminders);
  } catch (error) {
    console.error('Get today reminders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/overdue', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminders = await prisma.reminder.findMany({
      where: {
        isCompleted: false,
        dueDate: { lt: today },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        patient: { select: { patientId: true, status: true } },
      },
    });

    res.json(reminders);
  } catch (error) {
    console.error('Get overdue reminders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/complete', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await prisma.reminder.update({
      where: { id },
      data: { isCompleted: true },
    });
    res.json(reminder);
  } catch (error) {
    console.error('Complete reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.reminder.delete({ where: { id } });
    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
