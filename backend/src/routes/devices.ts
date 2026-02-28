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

    const patients = await prisma.patient.findMany({
      where: { id: { in: devices.filter(d => d.assignedPatientId).map(d => d.assignedPatientId!) } },
      select: { id: true, patientId: true, name: true }
    });
    const patientMap = new Map(patients.map(p => [p.id, p]));

    const devicesWithPatient = devices.map(d => ({
      ...d,
      patient: d.assignedPatientId ? patientMap.get(d.assignedPatientId) : null
    }));

    res.json(devicesWithPatient);
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
    console.log('Device create request:', req.body);
    const data = createDeviceSchema.parse(req.body);

    let setNumber = data.setNumber;
    
    if (!setNumber) {
      const maxSet = await prisma.deviceSet.findFirst({
        orderBy: { setNumber: 'desc' },
        select: { setNumber: true }
      });
      setNumber = (maxSet?.setNumber || 0) + 1;
    }

    const existingSet = await prisma.deviceSet.findUnique({
      where: { setNumber },
    });

    if (existingSet) {
      const allSets = await prisma.deviceSet.findMany({
        orderBy: { setNumber: 'asc' },
        select: { setNumber: true }
      });
      let newSetNum = 1;
      const takenSets = allSets.map(s => s.setNumber);
      while (takenSets.includes(newSetNum)) {
        newSetNum++;
      }
      setNumber = newSetNum;
    }

    const existingMars = await prisma.deviceSet.findUnique({
      where: { marsDeviceId: data.marsDeviceId },
    });
    if (existingMars) {
      return res.status(400).json({ error: 'MARS Device ID already exists' });
    }

    const existingPluto = await prisma.deviceSet.findUnique({
      where: { plutoDeviceId: data.plutoDeviceId },
    });
    if (existingPluto) {
      return res.status(400).json({ error: 'PLUTO Device ID already exists' });
    }

    console.log('Creating device with setNumber:', setNumber);

    const device = await prisma.deviceSet.create({
      data: {
        setNumber,
        marsDeviceId: data.marsDeviceId,
        plutoDeviceId: data.plutoDeviceId,
        laptopNumber: data.laptopNumber || '',
        modemSerial: data.modemSerial || '',
        actigraphLeftSerial: data.actigraphLeftSerial || '',
        actigraphRightSerial: data.actigraphRightSerial || '',
      },
    });

    console.log('Device created:', device.id);
    res.status(201).json(device);
  } catch (error) {
    console.error('Create device error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
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

// Swap actigraph watches (for 15th day swap) - uses shared pool
router.post('/:id/swap-actigraphs', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const device = await prisma.deviceSet.findUnique({ where: { id } });
    if (!device) {
      return res.status(404).json({ error: 'Device set not found' });
    }

    // Get available backup actigraphs from the shared pool
    const availableBackups = await prisma.backupActigraph.findMany({
      where: { isInUse: false },
      orderBy: { name: 'asc' }
    });

    if (availableBackups.length === 0) {
      return res.status(400).json({ error: 'No backup actigraphs available in the pool. Please add backup watches first.' });
    }

    // Use the first available backup pair
    const backup = availableBackups[0];

    // Swap: current actigraphs become the new backup
    const updatedDevice = await prisma.deviceSet.update({
      where: { id },
      data: {
        actigraphLeftSerial: backup.leftSerial,
        actigraphRightSerial: backup.rightSerial,
      },
    });

    // Mark this backup as in use
    await prisma.backupActigraph.update({
      where: { id: backup.id },
      data: { isInUse: true }
    });

    // Mark any previously in-use backup as available (only one can be in use at a time)
    await prisma.backupActigraph.updateMany({
      where: { 
        id: { not: backup.id },
        isInUse: true 
      },
      data: { isInUse: false }
    });

    res.json({ 
      device: updatedDevice, 
      swappedFrom: { left: device.actigraphLeftSerial, right: device.actigraphRightSerial },
      swappedTo: { left: backup.leftSerial, right: backup.rightSerial }
    });
  } catch (error) {
    console.error('Swap actigraphs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Backup Actigraphs CRUD
router.get('/backup-actigraphs', authenticate, async (req, res) => {
  try {
    const backups = await prisma.backupActigraph.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(backups);
  } catch (error) {
    console.error('Get backup actigraphs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/backup-actigraphs', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, leftSerial, rightSerial } = req.body;

    if (!name || !leftSerial || !rightSerial) {
      return res.status(400).json({ error: 'Name, left serial, and right serial are required' });
    }

    const existing = await prisma.backupActigraph.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ error: 'A backup actigraph with this name already exists' });
    }

    const backup = await prisma.backupActigraph.create({
      data: { name, leftSerial, rightSerial }
    });

    res.status(201).json(backup);
  } catch (error) {
    console.error('Create backup actigraph error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/backup-actigraphs/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, leftSerial, rightSerial, isInUse } = req.body;

    const backup = await prisma.backupActigraph.findUnique({ where: { id } });
    if (!backup) {
      return res.status(404).json({ error: 'Backup actigraph not found' });
    }

    const updated = await prisma.backupActigraph.update({
      where: { id },
      data: { 
        ...(name && { name }),
        ...(leftSerial && { leftSerial }),
        ...(rightSerial && { rightSerial }),
        ...(typeof isInUse === 'boolean' && { isInUse })
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update backup actigraph error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/backup-actigraphs/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.backupActigraph.delete({ where: { id } });
    res.json({ message: 'Backup actigraph deleted successfully' });
  } catch (error) {
    console.error('Delete backup actigraph error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
