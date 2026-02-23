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
      'Patient ID,Name,Gender,Age,Affected Hand,Group,VCG Assignment,A0 Date,Study Start,Enrollment Date,Phone,Status',
      ...patients.map((p: any) =>
        [
          p.patientId,
          `"${(p.name || '').replace(/"/g, '""')}"`,
          p.gender || '',
          p.age,
          p.affectedHand,
          p.groupType,
          p.vcgAssignment || '',
          p.a0Date ? new Date(p.a0Date).toISOString().split('T')[0] : '',
          new Date(p.studyStartDate).toISOString().split('T')[0],
          new Date(p.enrollmentDate).toISOString().split('T')[0],
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
      'Patient ID,Name,Gender,Age,Group,Study Start Date,Dropout Date,Dropout Reason',
      ...patients.map((p: any) =>
        [
          p.patientId,
          `"${(p.name || '').replace(/"/g, '""')}"`,
          p.gender || '',
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

router.get('/patient/:id', authenticate, async (req, res) => {
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

    let csv = 'HOMER Study - Individual Patient Report\n';
    csv += `\nPatient Information\n`;
    csv += `Patient ID,Name,Gender,Age,Affected Hand,Group,VCG Assignment,A0 Date,Study Start,Enrollment Date,Phone,Status\n`;
    csv += [
      patient.patientId,
      patient.name || '',
      patient.gender || '',
      patient.age,
      patient.affectedHand,
      patient.groupType,
      patient.vcgAssignment || '',
      patient.a0Date ? patient.a0Date.toISOString().split('T')[0] : '',
      patient.studyStartDate.toISOString().split('T')[0],
      patient.enrollmentDate.toISOString().split('T')[0],
      patient.phoneNumber || '',
      patient.status,
    ].join(',') + '\n';

    if (patient.adverseEvents && patient.adverseEvents.length > 0) {
      csv += `\nAdverse Events\n`;
      csv += `Date,Study Day,Event Type,Severity,Description,Action Taken,Reported to PI,Requires Dropout\n`;
      csv += patient.adverseEvents.map((e: any) =>
        [
          e.eventDate.toISOString().split('T')[0],
          e.studyDay,
          e.eventType,
          e.severity,
          `"${(e.description || '').replace(/"/g, '""')}"`,
          `"${(e.actionTaken || '').replace(/"/g, '""')}"`,
          e.reportedToPi ? 'Yes' : 'No',
          e.requiresDropout ? 'Yes' : 'No',
        ].join(',')
      ).join('\n') + '\n';
    }

    if (patient.interventionSessions && patient.interventionSessions.length > 0) {
      csv += `\nIntervention Sessions\n`;
      csv += `Date,Study Day,Duration (min),Robotic Score,Exercises,Mechanisms Used,ADL Training,Patient Feedback,Therapist Notes\n`;
      csv += patient.interventionSessions.map((s: any) =>
        [
          s.sessionDate.toISOString().split('T')[0],
          s.studyDay,
          s.durationMinutes || '',
          s.roboticAssessmentScore || '',
          `"${(s.exercisesPerformed || '').replace(/"/g, '""')}"`,
          `"${(s.mechanismsUsed || '').replace(/"/g, '""')}"`,
          `"${(s.adlTrainingGiven || '').replace(/"/g, '""')}"`,
          `"${(s.patientFeedback || '').replace(/"/g, '""')}"`,
          `"${(s.therapistNotes || '').replace(/"/g, '""')}"`,
        ].join(',')
      ).join('\n') + '\n';
    }

    if (patient.controlSessions && patient.controlSessions.length > 0) {
      csv += `\nControl Sessions\n`;
      csv += `Date,Study Day,Duration (min),Manual Exercises,ADL Training,Patient Feedback,Therapist Notes\n`;
      csv += patient.controlSessions.map((s: any) =>
        [
          s.sessionDate.toISOString().split('T')[0],
          s.studyDay,
          s.durationMinutes || '',
          `"${(s.manualExercisesGiven || '').replace(/"/g, '""')}"`,
          `"${(s.adlTrainingGiven || '').replace(/"/g, '""')}"`,
          `"${(s.patientFeedback || '').replace(/"/g, '""')}"`,
          `"${(s.therapistNotes || '').replace(/"/g, '""')}"`,
        ].join(',')
      ).join('\n') + '\n';
    }

    if (patient.issueLogs && patient.issueLogs.length > 0) {
      csv += `\nIssue Logs\n`;
      csv += `Date,Contact Type,Duration (min),Issue Type,Description,Root Cause,Solution,Follow-up Required,Follow-up Date\n`;
      csv += patient.issueLogs.map((i: any) =>
        [
          i.contactDate.toISOString().split('T')[0],
          i.contactType,
          i.durationMinutes || '',
          i.issueType,
          `"${(i.issueDescription || '').replace(/"/g, '""')}"`,
          `"${(i.rootCause || '').replace(/"/g, '""')}"`,
          `"${(i.solutionProvided || '').replace(/"/g, '""')}"`,
          i.followUpRequired ? 'Yes' : 'No',
          i.followUpDate ? i.followUpDate.toISOString().split('T')[0] : '',
        ].join(',')
      ).join('\n') + '\n';
    }

    if (patient.studyEvents && patient.studyEvents.length > 0) {
      csv += `\nStudy Events\n`;
      csv += `Study Day,Event Name,Event Type,Scheduled Date,Status,Completion Date,Notes\n`;
      csv += patient.studyEvents.map((e: any) =>
        [
          e.studyDay,
          `"${(e.eventName || '').replace(/"/g, '""')}"`,
          e.eventType,
          e.scheduledDate.toISOString().split('T')[0],
          e.status,
          e.completionDate ? e.completionDate.toISOString().split('T')[0] : '',
          `"${(e.notes || '').replace(/"/g, '""')}"`,
        ].join(',')
      ).join('\n') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=patient_${patient.patientId}_data.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export patient error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
