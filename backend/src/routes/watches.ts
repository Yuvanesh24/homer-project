import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const watches = await prisma.actigraphWatch.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(watches);
  } catch (error) {
    console.error('Get watches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { name, leftSerial, rightSerial, isBackup } = req.body;

    if (!name || !leftSerial || !rightSerial) {
      return res.status(400).json({ error: 'Name, left serial, and right serial are required' });
    }

    const existing = await prisma.actigraphWatch.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ error: 'A watch with this name already exists' });
    }

    const watch = await prisma.actigraphWatch.create({
      data: { 
        name, 
        leftSerial, 
        rightSerial,
        isBackup: isBackup || false
      }
    });

    res.status(201).json(watch);
  } catch (error) {
    console.error('Create watch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, leftSerial, rightSerial, isBackup } = req.body;

    const watch = await prisma.actigraphWatch.findUnique({ where: { id } });
    if (!watch) {
      return res.status(404).json({ error: 'Watch not found' });
    }

    const updated = await prisma.actigraphWatch.update({
      where: { id },
      data: { 
        ...(name && { name }),
        ...(leftSerial && { leftSerial }),
        ...(rightSerial && { rightSerial }),
        ...(typeof isBackup === 'boolean' && { isBackup })
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update watch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.actigraphWatch.delete({ where: { id } });
    res.json({ message: 'Watch deleted successfully' });
  } catch (error) {
    console.error('Delete watch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/assign', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { id } = req.params;
    const { patientId } = req.body;

    const watch = await prisma.actigraphWatch.findUnique({ where: { id } });
    if (!watch) {
      return res.status(404).json({ error: 'Watch not found' });
    }

    if (watch.assignedPatientId) {
      return res.status(400).json({ error: 'Watch is already assigned to a patient' });
    }

    const updated = await prisma.actigraphWatch.update({
      where: { id },
      data: {
        assignedPatientId: patientId,
        assignmentDate: new Date()
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Assign watch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/unassign', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { id } = req.params;

    const watch = await prisma.actigraphWatch.findUnique({ where: { id } });
    if (!watch) {
      return res.status(404).json({ error: 'Watch not found' });
    }

    const updated = await prisma.actigraphWatch.update({
      where: { id },
      data: {
        assignedPatientId: null,
        assignmentDate: null
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Unassign watch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/swap', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { id } = req.params;

    const watch = await prisma.actigraphWatch.findUnique({ where: { id } });
    if (!watch) {
      return res.status(404).json({ error: 'Watch not found' });
    }

    if (!watch.assignedPatientId) {
      return res.status(400).json({ error: 'Watch is not assigned to any patient' });
    }

    const availableBackup = await prisma.actigraphWatch.findFirst({
      where: { 
        isBackup: true,
        assignedPatientId: null
      }
    });

    if (!availableBackup) {
      return res.status(400).json({ error: 'No backup watch available for swap' });
    }

    const patientId = watch.assignedPatientId;

    await prisma.actigraphWatch.update({
      where: { id: watch.id },
      data: {
        assignedPatientId: null,
        assignmentDate: null,
        isBackup: true
      }
    });

    await prisma.actigraphWatch.update({
      where: { id: availableBackup.id },
      data: {
        assignedPatientId: patientId,
        assignmentDate: new Date(),
        isBackup: false
      }
    });

    res.json({ 
      message: 'Swap successful',
      oldWatch: watch.name,
      newWatch: availableBackup.name
    });
  } catch (error) {
    console.error('Swap watch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
