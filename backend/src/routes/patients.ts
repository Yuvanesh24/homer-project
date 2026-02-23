import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { createPatientSchema, updatePatientSchema, dropoutSchema } from '../utils/validation';
import { generatePatientId, generateStudyEvents, cancelFutureEvents, regenerateStudyEvents } from '../utils/studyUtils';
import { z } from 'zod';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, groupType, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status) where.status = status;
    if (groupType) where.groupType = groupType;
    if (search) {
      where.OR = [
        { patientId: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count({ where }),
    ]);

    res.json({
      patients,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        studyEvents: { orderBy: { studyDay: 'asc' } },
        interventionSessions: { orderBy: { sessionDate: 'desc' } },
        controlSessions: { orderBy: { sessionDate: 'desc' } },
        adverseEvents: { orderBy: { eventDate: 'desc' } },
        issueLogs: { orderBy: { contactDate: 'desc' } },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const deviceSet = await prisma.deviceSet.findFirst({
      where: { assignedPatientId: id }
    });

    res.json({ ...patient, deviceSet });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, authorize('admin', 'therapist'), async (req: AuthRequest, res) => {
  try {
    console.log('Creating patient with data:', req.body);
    const data = createPatientSchema.parse(req.body);

    const existingPatient = await prisma.patient.findUnique({
      where: { patientId: data.patientId }
    });
    if (existingPatient) {
      return res.status(400).json({ error: `Patient ID "${data.patientId}" already exists. Please use a different ID.` });
    }

    const patientId = data.patientId;
    const studyStartDate = new Date(data.studyStartDate);
    const enrollmentDate = new Date(data.enrollmentDate);
    const a0Date = data.a0Date ? new Date(data.a0Date) : null;

    console.log('Parsed data:', { patientId, studyStartDate, enrollmentDate, a0Date });

    const patient = await prisma.patient.create({
      data: {
        patientId,
        name: data.name || null,
        gender: data.gender || null,
        age: data.age,
        affectedHand: data.affectedHand,
        groupType: data.groupType,
        vcgAssignment: data.vcgAssignment || null,
        a0Date,
        studyStartDate,
        enrollmentDate,
        phoneNumber: data.phoneNumber || null,
        createdById: req.user!.id,
      },
    });

    console.log('Patient created:', patient.id);

    try {
      await generateStudyEvents(patient.id, studyStartDate, data.groupType, a0Date);
    } catch (eventError) {
      console.error('Failed to generate study events:', eventError);
    }

    const fullPatient = await prisma.patient.findUnique({
      where: { id: patient.id },
      include: { studyEvents: { orderBy: { studyDay: 'asc' } } },
    });

    res.status(201).json(fullPatient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, authorize('admin', 'therapist'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updatePatientSchema.parse(req.body);

    const existingPatient = await prisma.patient.findUnique({ where: { id } });
    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const updateData: any = { ...data };
    if (data.studyStartDate) {
      updateData.studyStartDate = new Date(data.studyStartDate);
    }
    if (data.enrollmentDate) {
      updateData.enrollmentDate = new Date(data.enrollmentDate);
    }
    if (data.a0Date) {
      updateData.a0Date = data.a0Date ? new Date(data.a0Date) : null;
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    if (data.studyStartDate || data.a0Date) {
      await regenerateStudyEvents(id, new Date(data.studyStartDate || existingPatient.studyStartDate), existingPatient.groupType, data.a0Date ? new Date(data.a0Date) : existingPatient.a0Date);
    }

    const fullPatient = await prisma.patient.findUnique({
      where: { id },
      include: { studyEvents: { orderBy: { studyDay: 'asc' } } },
    });

    res.json(fullPatient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/dropout', authenticate, authorize('admin', 'therapist'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { dropoutDate, dropoutReason, dropoutReasonType } = dropoutSchema.parse(req.body);

    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await prisma.$transaction([
      prisma.patient.update({
        where: { id },
        data: {
          status: 'dropped_out',
          dropoutDate: new Date(dropoutDate),
          dropoutReason,
          dropoutReasonType,
        },
      }),
      prisma.studyEvent.updateMany({
        where: {
          patientId: id,
          status: 'pending',
          scheduledDate: { gt: new Date(dropoutDate) },
        },
        data: { status: 'cancelled' },
      }),
    ]);

    const updatedPatient = await prisma.patient.findUnique({
      where: { id },
      include: { studyEvents: true },
    });

    res.json(updatedPatient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Dropout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/timeline', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        studyEvents: { orderBy: { studyDay: 'asc' } },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient.studyEvents);
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.$transaction(async (tx) => {
      await tx.deviceSet.updateMany({
        where: { assignedPatientId: id },
        data: { assignedPatientId: null, status: 'available', returnDate: new Date() }
      });
      
      await tx.studyEvent.deleteMany({ where: { patientId: id } });
      await tx.interventionSession.deleteMany({ where: { patientId: id } });
      await tx.controlSession.deleteMany({ where: { patientId: id } });
      await tx.adverseEvent.deleteMany({ where: { patientId: id } });
      await tx.issueLog.deleteMany({ where: { patientId: id } });
      await tx.reminder.deleteMany({ where: { patientId: id } });
      
      await tx.patient.delete({ where: { id } });
    });
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

export default router;
