import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { createAdverseEventSchema } from '../utils/validation';
import { z } from 'zod';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { severity, patientId } = req.query;
    const where: any = {};
    if (severity) where.severity = severity;
    if (patientId) where.patientId = patientId;

    const events = await prisma.adverseEvent.findMany({
      where,
      orderBy: { eventDate: 'desc' },
      include: {
        patient: { select: { patientId: true, groupType: true } },
        loggedBy: { select: { firstName: true, lastName: true } },
      },
    });

    res.json(events);
  } catch (error) {
    console.error('Get adverse events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/patient/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const events = await prisma.adverseEvent.findMany({
      where: { patientId },
      orderBy: { eventDate: 'desc' },
    });
    res.json(events);
  } catch (error) {
    console.error('Get patient adverse events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, authorize('admin', 'therapist'), async (req: AuthRequest, res) => {
  try {
    const data = createAdverseEventSchema.parse(req.body);

    const event = await prisma.adverseEvent.create({
      data: {
        patientId: data.patientId,
        eventDate: new Date(data.eventDate),
        studyDay: data.studyDay,
        eventType: data.eventType,
        severity: data.severity,
        description: data.description,
        actionTaken: data.actionTaken,
        reportedToPi: data.reportedToPi || false,
        requiresDropout: data.requiresDropout || false,
        loggedById: req.user!.id,
      },
    });

    if (data.requiresDropout) {
      await prisma.patient.update({
        where: { id: data.patientId },
        data: {
          status: 'dropped_out',
          dropoutDate: new Date(data.eventDate),
          dropoutReason: `Adverse event: ${data.eventType}`,
          dropoutReasonType: 'Adverse Event',
        },
      });

      await prisma.studyEvent.updateMany({
        where: {
          patientId: data.patientId,
          status: 'pending',
          scheduledDate: { gt: new Date(data.eventDate) },
        },
        data: { status: 'cancelled' },
      });
    }

    res.status(201).json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create adverse event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = createAdverseEventSchema.partial().parse(req.body);

    const updateData: any = { ...data };
    if (data.eventDate) updateData.eventDate = new Date(data.eventDate);

    const event = await prisma.adverseEvent.update({
      where: { id },
      data: updateData,
    });

    res.json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update adverse event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.adverseEvent.delete({ where: { id } });
    res.json({ message: 'Adverse event deleted' });
  } catch (error) {
    console.error('Delete adverse event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
