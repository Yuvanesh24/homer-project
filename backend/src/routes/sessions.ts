import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { createInterventionSessionSchema, createControlSessionSchema } from '../utils/validation';
import { z } from 'zod';

const router = Router();

router.get('/intervention/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const sessions = await prisma.interventionSession.findMany({
      where: { patientId },
      orderBy: { sessionDate: 'desc' },
      include: {
        loggedBy: { select: { firstName: true, lastName: true } },
      },
    });
    res.json(sessions);
  } catch (error) {
    console.error('Get intervention sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/control/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const sessions = await prisma.controlSession.findMany({
      where: { patientId },
      orderBy: { sessionDate: 'desc' },
      include: {
        loggedBy: { select: { firstName: true, lastName: true } },
      },
    });
    res.json(sessions);
  } catch (error) {
    console.error('Get control sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/intervention', authenticate, authorize('admin', 'therapist'), async (req: AuthRequest, res) => {
  try {
    const data = createInterventionSessionSchema.parse(req.body);

    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
      select: { groupType: true },
    });

    if (!patient || patient.groupType !== 'intervention') {
      return res.status(400).json({ error: 'Patient is not in intervention group' });
    }

    const session = await prisma.interventionSession.create({
      data: {
        patientId: data.patientId,
        sessionDate: new Date(data.sessionDate),
        studyDay: data.studyDay,
        durationMinutes: data.durationMinutes,
        roboticAssessmentScore: data.roboticAssessmentScore,
        exercisesPerformed: data.exercisesPerformed,
        mechanismsUsed: data.mechanismsUsed,
        adlTrainingGiven: data.adlTrainingGiven,
        patientFeedback: data.patientFeedback,
        therapistNotes: data.therapistNotes,
        devicePerformanceNotes: data.devicePerformanceNotes,
        loggedById: req.user!.id,
      },
    });

    res.status(201).json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create intervention session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/control', authenticate, authorize('admin', 'therapist'), async (req: AuthRequest, res) => {
  try {
    const data = createControlSessionSchema.parse(req.body);

    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
      select: { groupType: true },
    });

    if (!patient || patient.groupType !== 'control') {
      return res.status(400).json({ error: 'Patient is not in control group' });
    }

    const session = await prisma.controlSession.create({
      data: {
        patientId: data.patientId,
        sessionDate: new Date(data.sessionDate),
        studyDay: data.studyDay,
        durationMinutes: data.durationMinutes,
        manualExercisesGiven: data.manualExercisesGiven,
        adlTrainingGiven: data.adlTrainingGiven,
        patientFeedback: data.patientFeedback,
        therapistNotes: data.therapistNotes,
        loggedById: req.user!.id,
      },
    });

    res.status(201).json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create control session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/intervention/:id', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = createInterventionSessionSchema.partial().parse(req.body);

    const updateData: any = { ...data };
    if (data.sessionDate) updateData.sessionDate = new Date(data.sessionDate);

    const session = await prisma.interventionSession.update({
      where: { id },
      data: updateData,
    });

    res.json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update intervention session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/control/:id', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = createControlSessionSchema.partial().parse(req.body);

    const updateData: any = { ...data };
    if (data.sessionDate) updateData.sessionDate = new Date(data.sessionDate);

    const session = await prisma.controlSession.update({
      where: { id },
      data: updateData,
    });

    res.json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update control session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/intervention/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.interventionSession.delete({ where: { id } });
    res.json({ message: 'Session deleted' });
  } catch (error) {
    console.error('Delete intervention session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/control/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.controlSession.delete({ where: { id } });
    res.json({ message: 'Session deleted' });
  } catch (error) {
    console.error('Delete control session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
