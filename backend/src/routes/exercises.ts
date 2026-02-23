import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const exerciseSchema = z.object({
  groupType: z.enum(['intervention', 'control']),
  marsMechanisms: z.string().optional(),
  plutoMechanisms: z.string().optional(),
  controlExercises: z.string().optional(),
  adlNotes: z.string().optional(),
  notes: z.string().optional(),
  studyDay: z.number().int().min(0),
});

router.get('/patient/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const exercises = await prisma.patientExercise.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    res.json(exercises);
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, authorize('admin', 'therapist'), async (req: AuthRequest, res) => {
  try {
    const data = exerciseSchema.parse(req.body);
    const { patientId } = req.body;

    await prisma.patientExercise.updateMany({
      where: { patientId, isCurrent: true },
      data: { isCurrent: false },
    });

    const exercise = await prisma.patientExercise.create({
      data: {
        patientId,
        groupType: data.groupType,
        marsMechanisms: data.marsMechanisms || null,
        plutoMechanisms: data.plutoMechanisms || null,
        controlExercises: data.controlExercises || null,
        adlNotes: data.adlNotes || null,
        notes: data.notes || null,
        studyDay: data.studyDay,
        isCurrent: true,
        createdById: req.user!.id,
      },
    });

    res.status(201).json(exercise);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, authorize('admin', 'therapist'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = exerciseSchema.parse(req.body);
    const { patientId } = req.body;

    await prisma.patientExercise.updateMany({
      where: { patientId, isCurrent: true },
      data: { isCurrent: false },
    });

    const exercise = await prisma.patientExercise.create({
      data: {
        patientId,
        groupType: data.groupType,
        marsMechanisms: data.marsMechanisms || null,
        plutoMechanisms: data.plutoMechanisms || null,
        controlExercises: data.controlExercises || null,
        adlNotes: data.adlNotes || null,
        notes: data.notes || null,
        studyDay: data.studyDay,
        isCurrent: true,
        createdById: req.user!.id,
      },
    });

    res.status(201).json(exercise);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.patientExercise.delete({ where: { id } });
    res.json({ message: 'Exercise deleted' });
  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
