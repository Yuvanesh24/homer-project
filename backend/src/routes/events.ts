import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { updateEventSchema } from '../utils/validation';
import { z } from 'zod';
import { addDays } from 'date-fns';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { patientId, status, overdue, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (overdue === 'true') {
      where.status = 'pending';
      where.scheduledDate = { lt: new Date() };
    }

    const [events, total] = await Promise.all([
      prisma.studyEvent.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { scheduledDate: 'asc' },
        include: {
          patient: { select: { patientId: true, groupType: true, status: true } },
        },
      }),
      prisma.studyEvent.count({ where }),
    ]);

    res.json({
      events,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/patient/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const events = await prisma.studyEvent.findMany({
      where: { patientId },
      orderBy: { studyDay: 'asc' },
    });
    res.json(events);
  } catch (error) {
    console.error('Get patient events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, authorize('admin', 'therapist'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateEventSchema.parse(req.body);

    const existingEvent = await prisma.studyEvent.findUnique({ where: { id } });
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const updateData: any = { ...data };
    if (data.status === 'completed' && !data.completionDate) {
      updateData.completionDate = new Date();
    }
    if (data.completionDate) {
      updateData.completionDate = new Date(data.completionDate);
    }
    if (req.user) {
      updateData.completedById = req.user.id;
    }

    const event = await prisma.studyEvent.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { patientId: true, groupType: true } },
      },
    });

    if (data.status === 'completed') {
      await prisma.reminder.deleteMany({
        where: { referenceId: id },
      });
    }

    res.json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/cancel', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.studyEvent.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    res.json(event);
  } catch (error) {
    console.error('Cancel event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
