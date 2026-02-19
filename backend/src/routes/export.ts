import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/patients', authenticate, async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const csv = [
      'Patient ID,Age,Affected Hand,Group,VCG Assignment,Study Start,Enrollment Date,Phone,Status',
      ...patients.map((p: any) =>
        [
          p.patientId,
          p.age,
          p.affectedHand,
          p.groupType,
          p.vcgAssignment || '',
          p.studyStartDate.toISOString().split('T')[0],
          p.enrollmentDate.toISOString().split('T')[0],
          p.phoneNumber || '',
          p.status,
        ].join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=patients.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export patients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/adverse-events', authenticate, async (req, res) => {
  try {
    const events = await prisma.adverseEvent.findMany({
      orderBy: { eventDate: 'desc' },
    });

    const csv = [
      'Event Date,Study Day,Event Type,Severity,Description',
      ...events.map((e: any) =>
        [
          e.eventDate.toISOString().split('T')[0],
          e.studyDay,
          e.eventType,
          e.severity,
          `"${(e.description || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=adverse_events.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export adverse events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/dropouts', authenticate, async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { status: 'dropped_out' },
      orderBy: { dropoutDate: 'desc' },
    });

    const csv = [
      'Patient ID,Age,Group,Study Start Date,Dropout Date,Dropout Reason',
      ...patients.map((p: any) =>
        [
          p.patientId,
          p.age,
          p.groupType,
          p.studyStartDate.toISOString().split('T')[0],
          p.dropoutDate?.toISOString().split('T')[0] || '',
          `"${(p.dropoutReason || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=dropouts.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export dropouts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/devices', authenticate, async (req, res) => {
  try {
    const devices = await prisma.deviceSet.findMany({
      orderBy: { setNumber: 'asc' },
    });

    const csv = [
      'Set Number,MARS ID,PLUTO ID,Laptop,Modem,Actigraph Left,Actigraph Right,Status',
      ...devices.map((d: any) =>
        [
          d.setNumber,
          d.marsDeviceId,
          d.plutoDeviceId,
          d.laptopNumber,
          d.modemSerial,
          d.actigraphLeftSerial,
          d.actigraphRightSerial,
          d.status,
        ].join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=devices.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export devices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
