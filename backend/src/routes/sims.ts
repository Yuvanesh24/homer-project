import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { createSimSchema, rechargeSimSchema } from '../utils/validation';
import { z } from 'zod';
import { addDays } from 'date-fns';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { provider, expiring } = req.query;
    const where: any = { isActive: true };
    if (provider) where.provider = provider;

    const sims = await prisma.simCard.findMany({
      where,
      orderBy: { simNumber: 'asc' },
      include: {
        linkedDeviceSet: { select: { setNumber: true } },
      },
    });

    let filteredSims = sims;
    if (expiring === 'true') {
      const twoDaysFromNow = addDays(new Date(), 2);
      filteredSims = sims.filter(
        (sim) => sim.expiryDate && sim.expiryDate <= twoDaysFromNow
      );
    }

    res.json(filteredSims.map((sim) => ({
      ...sim,
      isExpired: sim.expiryDate ? sim.expiryDate < new Date() : false,
      isExpiringSoon: sim.expiryDate 
        ? sim.expiryDate > new Date() && sim.expiryDate <= addDays(new Date(), 2)
        : false,
    })));
  } catch (error) {
    console.error('Get SIMs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/expiring', authenticate, async (req, res) => {
  try {
    const twoDaysFromNow = addDays(new Date(), 2);
    const sims = await prisma.simCard.findMany({
      where: {
        isActive: true,
        expiryDate: { lte: twoDaysFromNow, gte: new Date() },
      },
      include: {
        linkedDeviceSet: { select: { setNumber: true } },
      },
    });

    res.json(sims.map((sim) => ({
      ...sim,
      isExpired: false,
      isExpiringSoon: true,
    })));
  } catch (error) {
    console.error('Get expiring SIMs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const sim = await prisma.simCard.findUnique({
      where: { id },
      include: {
        linkedDeviceSet: true,
        rechargeHistory: { orderBy: { rechargeDate: 'desc' } },
      },
    });

    if (!sim) {
      return res.status(404).json({ error: 'SIM card not found' });
    }

    res.json({
      ...sim,
      isExpired: sim.expiryDate ? sim.expiryDate < new Date() : false,
      isExpiringSoon: sim.expiryDate
        ? sim.expiryDate > new Date() && sim.expiryDate <= addDays(new Date(), 2)
        : false,
    });
  } catch (error) {
    console.error('Get SIM error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const data = createSimSchema.parse(req.body);

    const existing = await prisma.simCard.findUnique({
      where: { simNumber: data.simNumber },
    });

    if (existing) {
      return res.status(400).json({ error: 'SIM number already exists' });
    }

    const sim = await prisma.simCard.create({
      data: {
        simNumber: data.simNumber,
        provider: data.provider,
        linkedDeviceSetId: data.linkedDeviceSetId,
      },
    });

    res.status(201).json(sim);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create SIM error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { linkedDeviceSetId } = req.body;

    const sim = await prisma.simCard.update({
      where: { id },
      data: { linkedDeviceSetId },
    });

    res.json(sim);
  } catch (error) {
    console.error('Update SIM error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/recharge', authenticate, authorize('admin', 'therapist'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { rechargeDate, durationDays } = rechargeSimSchema.parse(req.body);

    const expiryDate = addDays(new Date(rechargeDate), durationDays);

    const [sim, history] = await Promise.all([
      prisma.simCard.update({
        where: { id },
        data: {
          rechargeDate: new Date(rechargeDate),
          rechargeDurationDays: durationDays,
          expiryDate,
        },
      }),
      prisma.simRechargeHistory.create({
        data: {
          simCardId: id,
          rechargeDate: new Date(rechargeDate),
          durationDays,
          expiryDate,
          loggedById: req.user!.id,
        },
      }),
    ]);

    await prisma.reminder.deleteMany({
      where: {
        OR: [
          { patientId: null, reminderType: 'sim_recharge', referenceId: id },
          { patientId: undefined, reminderType: 'sim_recharge', referenceId: id }
        ]
      },
    });

    const reminderDueDate = addDays(expiryDate, -2);
    if (reminderDueDate > new Date()) {
      await prisma.reminder.create({
        data: {
          patientId: null,
          reminderType: 'sim_recharge',
          referenceId: id,
          title: 'SIM Recharge Required',
          description: `SIM ${sim.simNumber} will expire on ${expiryDate.toISOString().split('T')[0]}`,
          dueDate: reminderDueDate,
        },
      });
    }

    res.json({ ...sim, rechargeHistory: history });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Recharge SIM error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.simCard.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ message: 'SIM card deactivated' });
  } catch (error) {
    console.error('Delete SIM error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
