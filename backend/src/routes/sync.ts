import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';

const router = Router();

interface ExportData {
  exportedAt: string;
  version: string;
  patients: any[];
  studyEvents: any[];
  deviceSets: any[];
  simCards: any[];
  simRechargeHistories: any[];
  interventionSessions: any[];
  controlSessions: any[];
  adverseEvents: any[];
  issueLogs: any[];
  reminders: any[];
  patientExercises: any[];
}

router.get('/all', authenticate, async (req, res) => {
  try {
    const data: ExportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      patients: await prisma.patient.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      studyEvents: await prisma.studyEvent.findMany({
        orderBy: { scheduledDate: 'desc' },
      }),
      deviceSets: await prisma.deviceSet.findMany({
        orderBy: { setNumber: 'asc' },
      }),
      simCards: await prisma.simCard.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      simRechargeHistories: await prisma.simRechargeHistory.findMany({
        orderBy: { rechargeDate: 'desc' },
      }),
      interventionSessions: await prisma.interventionSession.findMany({
        orderBy: { sessionDate: 'desc' },
      }),
      controlSessions: await prisma.controlSession.findMany({
        orderBy: { sessionDate: 'desc' },
      }),
      adverseEvents: await prisma.adverseEvent.findMany({
        orderBy: { eventDate: 'desc' },
      }),
      issueLogs: await prisma.issueLog.findMany({
        orderBy: { contactDate: 'desc' },
      }),
      reminders: await prisma.reminder.findMany({
        orderBy: { dueDate: 'asc' },
      }),
      patientExercises: await prisma.patientExercise.findMany({
        orderBy: { studyDay: 'asc' },
      }),
    };

    const json = JSON.stringify(data, null, 2);
    const filename = `homer_backup_${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(json);
  } catch (error) {
    console.error('Export all data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/patients-json', authenticate, async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const data = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      patients,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=patients.json');
    res.json(data);
  } catch (error) {
    console.error('Export patients JSON error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/devices-json', authenticate, async (req, res) => {
  try {
    const devices = await prisma.deviceSet.findMany({
      orderBy: { setNumber: 'asc' },
    });

    const data = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      devices,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=devices.json');
    res.json(data);
  } catch (error) {
    console.error('Export devices JSON error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/import', authenticate, async (req, res) => {
  try {
    const {
      patients,
      studyEvents,
      deviceSets,
      simCards,
      simRechargeHistories,
      interventionSessions,
      controlSessions,
      adverseEvents,
      issueLogs,
      reminders,
      patientExercises,
      mode = 'merge'
    } = req.body;

    const results: any = {
      imported: {},
      errors: [],
    };

    if (mode === 'replace') {
      await prisma.simRechargeHistory.deleteMany();
      await prisma.issueLog.deleteMany();
      await prisma.adverseEvent.deleteMany();
      await prisma.interventionSession.deleteMany();
      await prisma.controlSession.deleteMany();
      await prisma.studyEvent.deleteMany();
      await prisma.patientExercise.deleteMany();
      await prisma.reminder.deleteMany();
      await prisma.simCard.deleteMany();
      await prisma.deviceSet.deleteMany();
      await prisma.patient.deleteMany();
    }

    if (patients && Array.isArray(patients)) {
      results.imported.patients = await Promise.all(
        patients.map(async (patient: any) => {
          try {
            return await prisma.patient.upsert({
              where: { id: patient.id || patient.patientId },
              update: patient,
              create: patient,
            });
          } catch (e: any) {
            results.errors.push({ table: 'patients', error: e.message });
            return null;
          }
        })
      );
    }

    if (studyEvents && Array.isArray(studyEvents)) {
      results.imported.studyEvents = await Promise.all(
        studyEvents.map(async (event: any) => {
          try {
            return await prisma.studyEvent.upsert({
              where: { id: event.id },
              update: event,
              create: event,
            });
          } catch (e: any) {
            results.errors.push({ table: 'studyEvents', error: e.message });
            return null;
          }
        })
      );
    }

    if (deviceSets && Array.isArray(deviceSets)) {
      results.imported.deviceSets = await Promise.all(
        deviceSets.map(async (device: any) => {
          try {
            return await prisma.deviceSet.upsert({
              where: { id: device.id },
              update: device,
              create: device,
            });
          } catch (e: any) {
            results.imported.deviceSetsErrors = e.message;
            return null;
          }
        })
      );
    }

    if (simCards && Array.isArray(simCards)) {
      results.imported.simCards = await Promise.all(
        simCards.map(async (sim: any) => {
          try {
            return await prisma.simCard.upsert({
              where: { id: sim.id },
              update: sim,
              create: sim,
            });
          } catch (e: any) {
            results.errors.push({ table: 'simCards', error: e.message });
            return null;
          }
        })
      );
    }

    if (simRechargeHistories && Array.isArray(simRechargeHistories)) {
      results.imported.simRechargeHistories = await Promise.all(
        simRechargeHistories.map(async (history: any) => {
          try {
            return await prisma.simRechargeHistory.create({
              data: history,
            });
          } catch (e: any) {
            results.errors.push({ table: 'simRechargeHistories', error: e.message });
            return null;
          }
        })
      );
    }

    if (interventionSessions && Array.isArray(interventionSessions)) {
      results.imported.interventionSessions = await Promise.all(
        interventionSessions.map(async (session: any) => {
          try {
            return await prisma.interventionSession.upsert({
              where: { id: session.id },
              update: session,
              create: session,
            });
          } catch (e: any) {
            results.errors.push({ table: 'interventionSessions', error: e.message });
            return null;
          }
        })
      );
    }

    if (controlSessions && Array.isArray(controlSessions)) {
      results.imported.controlSessions = await Promise.all(
        controlSessions.map(async (session: any) => {
          try {
            return await prisma.controlSession.upsert({
              where: { id: session.id },
              update: session,
              create: session,
            });
          } catch (e: any) {
            results.errors.push({ table: 'controlSessions', error: e.message });
            return null;
          }
        })
      );
    }

    if (adverseEvents && Array.isArray(adverseEvents)) {
      results.imported.adverseEvents = await Promise.all(
        adverseEvents.map(async (event: any) => {
          try {
            return await prisma.adverseEvent.upsert({
              where: { id: event.id },
              update: event,
              create: event,
            });
          } catch (e: any) {
            results.errors.push({ table: 'adverseEvents', error: e.message });
            return null;
          }
        })
      );
    }

    if (issueLogs && Array.isArray(issueLogs)) {
      results.imported.issueLogs = await Promise.all(
        issueLogs.map(async (issue: any) => {
          try {
            return await prisma.issueLog.upsert({
              where: { id: issue.id },
              update: issue,
              create: issue,
            });
          } catch (e: any) {
            results.errors.push({ table: 'issueLogs', error: e.message });
            return null;
          }
        })
      );
    }

    if (reminders && Array.isArray(reminders)) {
      results.imported.reminders = await Promise.all(
        reminders.map(async (reminder: any) => {
          try {
            return await prisma.reminder.upsert({
              where: { id: reminder.id },
              update: reminder,
              create: reminder,
            });
          } catch (e: any) {
            results.errors.push({ table: 'reminders', error: e.message });
            return null;
          }
        })
      );
    }

    if (patientExercises && Array.isArray(patientExercises)) {
      results.imported.patientExercises = await Promise.all(
        patientExercises.map(async (exercise: any) => {
          try {
            return await prisma.patientExercise.upsert({
              where: { id: exercise.id },
              update: exercise,
              create: exercise,
            });
          } catch (e: any) {
            results.errors.push({ table: 'patientExercises', error: e.message });
            return null;
          }
        })
      );
    }

    const importedCount = Object.keys(results.imported).reduce((acc, key) => {
      const arr = results.imported[key] as any[];
      return acc + (arr ? arr.filter(Boolean).length : 0);
    }, 0);

    res.json({
      success: true,
      message: `Imported ${importedCount} records`,
      mode,
      results,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Import failed: ' + error.message });
  }
});

router.post('/dropbox/upload', authenticate, async (req, res) => {
  try {
    const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;
    
    if (!DROPBOX_ACCESS_TOKEN) {
      return res.status(400).json({ 
        error: 'Dropbox not configured. Add DROPBOX_ACCESS_TOKEN to .env file.' 
      });
    }

    const data: ExportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      patients: await prisma.patient.findMany({ orderBy: { createdAt: 'desc' } }),
      studyEvents: await prisma.studyEvent.findMany({ orderBy: { scheduledDate: 'desc' } }),
      deviceSets: await prisma.deviceSet.findMany({ orderBy: { setNumber: 'asc' } }),
      simCards: await prisma.simCard.findMany({ orderBy: { createdAt: 'desc' } }),
      simRechargeHistories: await prisma.simRechargeHistory.findMany({ orderBy: { rechargeDate: 'desc' } }),
      interventionSessions: await prisma.interventionSession.findMany({ orderBy: { sessionDate: 'desc' } }),
      controlSessions: await prisma.controlSession.findMany({ orderBy: { sessionDate: 'desc' } }),
      adverseEvents: await prisma.adverseEvent.findMany({ orderBy: { eventDate: 'desc' } }),
      issueLogs: await prisma.issueLog.findMany({ orderBy: { contactDate: 'desc' } }),
      reminders: await prisma.reminder.findMany({ orderBy: { dueDate: 'asc' } }),
      patientExercises: await prisma.patientExercise.findMany({ orderBy: { studyDay: 'asc' } }),
    };

    const dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN, fetch });
    const json = JSON.stringify(data, null, 2);
    const filename = `homer_backup_${new Date().toISOString().split('T')[0]}.json`;

    const result = await dbx.filesUpload({
      path: '/' + filename,
      contents: json,
      mode: { '.tag': 'overwrite' }
    });

    res.json({ 
      success: true, 
      message: 'Backup uploaded to Dropbox',
      path: result.result.path_lower 
    });
  } catch (error: any) {
    console.error('Dropbox upload error:', error);
    const errorMsg = error.response?.data?.error_summary || error.message || 'Unknown error';
    res.status(500).json({ error: 'Dropbox upload failed: ' + errorMsg });
  }
});

router.post('/dropbox/download', authenticate, async (req, res) => {
  try {
    const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;
    const { filename } = req.body;

    if (!DROPBOX_ACCESS_TOKEN) {
      return res.status(400).json({ 
        error: 'Dropbox not configured. Add DROPBOX_ACCESS_TOKEN to .env file.' 
      });
    }

    const dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN, fetch });
    
    const searchResult = await dbx.filesListFolder({ path: '' });
    const backupFiles = searchResult.result.entries
      .filter(f => f['.tag'] === 'file' && f.name.startsWith('homer_backup') && f.name.endsWith('.json'))
      .sort((a, b) => (b.name || '').localeCompare(a.name || ''));

    if (backupFiles.length === 0) {
      return res.status(404).json({ error: 'No backup files found in Dropbox' });
    }

    const targetFile = filename 
      ? backupFiles.find(f => f.name === filename) 
      : backupFiles[0];

    if (!targetFile) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    const file = await dbx.filesDownload({ path: targetFile.path_lower || '' });
    
    const fileBinary = (file.result as any).fileBinary;
    if (!fileBinary) {
      return res.status(500).json({ error: 'Failed to read file from Dropbox' });
    }

    res.json({ 
      success: true, 
      data: JSON.parse(Buffer.from(fileBinary).toString('utf-8')),
      filename: targetFile.name
    });
  } catch (error: any) {
    console.error('Dropbox download error:', error);
    res.status(500).json({ error: 'Dropbox download failed: ' + error.message });
  }
});

router.get('/dropbox/list', authenticate, async (req, res) => {
  try {
    const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;

    if (!DROPBOX_ACCESS_TOKEN) {
      return res.status(400).json({ 
        error: 'Dropbox not configured. Add DROPBOX_ACCESS_TOKEN to .env file.' 
      });
    }

    const dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN, fetch });
    const result = await dbx.filesListFolder({ path: '' });
    
    const backupFiles = result.result.entries
      .filter(f => f['.tag'] === 'file' && f.name && f.name.startsWith('homer_backup') && f.name.endsWith('.json'))
      .map(f => ({
        name: f.name,
        path: f.path_lower,
        size: (f as any).size,
        modified: (f as any).server_modified
      }))
      .sort((a, b) => (b.name || '').localeCompare(a.name || ''));

    res.json({ files: backupFiles });
  } catch (error: any) {
    console.error('Dropbox list error:', error);
    res.status(500).json({ error: 'Failed to list Dropbox files: ' + error.message });
  }
});

export default router;
