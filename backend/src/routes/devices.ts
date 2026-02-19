import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { createDeviceSchema, updateDeviceSchema } from '../utils/validation';
import { z } from 'zod';
import { addDays } from 'date-fns';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = status;

    const devices = await prisma.deviceSet.findMany({
      where,
      orderBy: { setNumber: 'asc' },
      include: {
        simCards: true,
      },
    });

    res.json(devices);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const device = await prisma.deviceSet.findUnique({
      where: { id },
      include: {
        simCards: { include: { rechargeHistory: { orderBy: { rechargeDate: 'desc' } } } },
      },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device set not found' });
    }

    res.json(device);
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const data = createDeviceSchema.parse(req.body);

    const existing = await prisma.deviceSet.findFirst({
      where: { setNumber: data.setNumber },
    });

    if (existing) {
      return res.status(400).json({ error: 'Device set number already exists' });
    }

    const device = await prisma.deviceSet.create({
      data: {
        setNumber: data.setNumber,
        marsDeviceId: data.marsDeviceId,
        plutoDeviceId: data.plutoDeviceId,
        laptopNumber: data.laptopNumber,
        modemSerial: data.modemSerial,
        actigraphLeftSerial: data.actigraphLeftSerial,
        actigraphRightSerial: data.actigraphRightSerial,
      },
    });

    res.status(201).json(device);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateDeviceSchema.parse(req.body);

    const device = await prisma.deviceSet.update({
      where: { id },
      data,
    });

    res.json(device);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/assign', authenticate, authorize('admin', 'therapist'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { patientId, expectedReturnDate } = req.body;

    const device = await prisma.deviceSet.findUnique({ where: { id } });
    if (!device) {
      return res.status(404).json({ error: 'Device set not found' });
    }

    if (device.status === 'in_use') {
      return res.status(400).json({ error: 'Device is already in use' });
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const updatedDevice = await prisma.deviceSet.update({
      where: { id },
      data: {
        status: 'in_use',
        assignedPatientId: patientId,
        assignmentDate: new Date(),
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : addDays(new Date(), 30),
      },
    });

    res.json(updatedDevice);
  } catch (error) {
    console.error('Assign device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/return', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { id } = req.params;

    const device = await prisma.deviceSet.findUnique({ where: { id } });
    if (!device) {
      return res.status(404).json({ error: 'Device set not found' });
    }

    const updatedDevice = await prisma.deviceSet.update({
      where: { id },
      data: {
        status: 'available',
        assignedPatientId: null,
        returnDate: new Date(),
      },
    });

    res.json(updatedDevice);
  } catch (error) {
    console.error('Return device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.deviceSet.delete({ where: { id } });
    res.json({ message: 'Device set deleted successfully' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
