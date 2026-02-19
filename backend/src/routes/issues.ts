import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { createIssueLogSchema } from '../utils/validation';
import { z } from 'zod';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { issueType, patientId, followUpRequired } = req.query;
    const where: any = {};
    if (issueType) where.issueType = issueType;
    if (patientId) where.patientId = patientId;
    if (followUpRequired === 'true') where.followUpRequired = true;

    const logs = await prisma.issueLog.findMany({
      where,
      orderBy: { contactDate: 'desc' },
      include: {
        patient: { select: { patientId: true, groupType: true } },
        loggedBy: { select: { firstName: true, lastName: true } },
      },
    });

    res.json(logs);
  } catch (error) {
    console.error('Get issue logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/patient/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const logs = await prisma.issueLog.findMany({
      where: { patientId },
      orderBy: { contactDate: 'desc' },
    });
    res.json(logs);
  } catch (error) {
    console.error('Get patient issue logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, authorize('admin', 'therapist'), async (req: AuthRequest, res) => {
  try {
    const data = createIssueLogSchema.parse(req.body);

    const log = await prisma.issueLog.create({
      data: {
        patientId: data.patientId,
        contactDate: new Date(data.contactDate),
        contactType: data.contactType,
        durationMinutes: data.durationMinutes,
        issueType: data.issueType,
        issueDescription: data.issueDescription,
        rootCause: data.rootCause,
        solutionProvided: data.solutionProvided,
        followUpRequired: data.followUpRequired || false,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        loggedById: req.user!.id,
      },
    });

    if (data.followUpRequired && data.followUpDate) {
      await prisma.reminder.create({
        data: {
          patientId: data.patientId,
          reminderType: 'follow_up',
          referenceId: log.id,
          title: 'Follow-up Required',
          description: `Follow-up for issue: ${data.issueDescription || data.issueType}`,
          dueDate: new Date(data.followUpDate),
        },
      });
    }

    res.status(201).json(log);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create issue log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = createIssueLogSchema.partial().parse(req.body);

    const updateData: any = { ...data };
    if (data.contactDate) updateData.contactDate = new Date(data.contactDate);
    if (data.followUpDate) updateData.followUpDate = new Date(data.followUpDate);

    const log = await prisma.issueLog.update({
      where: { id },
      data: updateData,
    });

    res.json(log);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update issue log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.issueLog.delete({ where: { id } });
    res.json({ message: 'Issue log deleted' });
  } catch (error) {
    console.error('Delete issue log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
