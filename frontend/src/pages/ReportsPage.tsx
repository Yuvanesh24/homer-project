import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { Patient } from '@/types';
import { Download, FileText, Users, AlertTriangle, Tablet, Upload, Database, RefreshCw, Cloud } from 'lucide-react';

export function ReportsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importing, setImporting] = useState(false);
  const [dropboxDialogOpen, setDropboxDialogOpen] = useState(false);
  const [dropboxFiles, setDropboxFiles] = useState<any[]>([]);
  const [dropboxLoading, setDropboxLoading] = useState(false);
  const [dropboxSyncing, setDropboxSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients?limit=100');
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const handleExport = async (type: string) => {
    try {
      const endpoint = type === 'patients' ? '/export/patients' : 
                      type === 'adverse' ? '/export/adverse-events' :
                      type === 'dropouts' ? '/export/dropouts' : '/export/devices';
      
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = type === 'patients' ? 'patients.csv' :
                      type === 'adverse' ? 'adverse_events.csv' :
                      type === 'dropouts' ? 'dropouts.csv' : 'devices.csv';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportPatientData = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient');
      return;
    }
    try {
      const response = await api.get(`/export/patient/${selectedPatientId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const patient = patients.find(p => p.id === selectedPatientId);
      const filename = patient ? `patient_${patient.patientId}_data.csv` : 'patient_data.csv';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportJSON = async () => {
    try {
      const response = await api.get('/sync/all', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `homer_backup_${timestamp}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('JSON export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const response = await api.post('/sync/import', {
        ...data,
        mode: importMode,
      });
      
      alert(`Import successful! ${response.data.message}`);
      setImportDialogOpen(false);
    } catch (error: any) {
      console.error('Import failed:', error);
      alert(`Import failed: ${error.response?.data?.error || error.message}`);
} finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDropboxUpload = async () => {
    setDropboxSyncing(true);
    try {
      await api.post('/sync/dropbox/upload');
      alert('Backup uploaded to Dropbox successfully!');
    } catch (error: any) {
      console.error('Dropbox upload failed:', error);
      alert(error.response?.data?.error || 'Failed to upload to Dropbox. Make sure DROPBOX_ACCESS_TOKEN is configured.');
    } finally {
      setDropboxSyncing(false);
    }
  };

  const handleDropboxDownload = async (filename?: string) => {
    setDropboxSyncing(true);
    try {
      const response = await api.post('/sync/dropbox/download', { filename });
      const data = response.data.data;
      
      const importResponse = await api.post('/sync/import', {
        ...data,
        mode: importMode,
      });
      
      alert(`Synced from Dropbox! ${importResponse.data.message}`);
      setDropboxDialogOpen(false);
    } catch (error: any) {
      console.error('Dropbox download failed:', error);
      alert(error.response?.data?.error || 'Failed to sync from Dropbox.');
    } finally {
      setDropboxSyncing(false);
    }
  };

  const handleOpenDropboxDialog = async () => {
    setDropboxDialogOpen(true);
    setDropboxLoading(true);
    try {
      const response = await api.get('/sync/dropbox/list');
      setDropboxFiles(response.data.files || []);
    } catch (error: any) {
      console.error('Failed to list Dropbox files:', error);
      setDropboxFiles([]);
      if (error.response?.status !== 400) {
        alert(error.response?.data?.error || 'Failed to load Dropbox files.');
      }
    } finally {
      setDropboxLoading(false);
    }
  };

  const reports = [
    {
      title: 'Patients Report',
      description: 'Export all patient data including demographics, group assignments, and study status',
      icon: Users,
      type: 'patients',
    },
    {
      title: 'Adverse Events Report',
      description: 'Export all adverse events with severity, descriptions, and outcomes',
      icon: AlertTriangle,
      type: 'adverse',
    },
    {
      title: 'Dropout Report',
      description: 'Export all patient dropouts with reasons and adverse event correlations',
      icon: Users,
      type: 'dropouts',
    },
    {
      title: 'Device Utilization Report',
      description: 'Export device assignment history, usage, and return status',
      icon: Tablet,
      type: 'devices',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Reports & Export</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Individual Patient Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Export all data for a specific patient including sessions, adverse events, and issues</p>
          <div className="flex gap-4">
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.patientId} - {patient.name || '(No name)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleExportPatientData} disabled={!selectedPatientId}>
              <Download className="mr-2 h-4 w-4" />
              Export Patient Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => (
          <Card key={report.type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <report.icon className="h-5 w-5" />
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <Button onClick={() => handleExport(report.type)}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup & Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Export all data as JSON for backup or import from another device. Use this to sync data between devices.
          </p>
          <div className="flex gap-4">
            <Button onClick={handleExportJSON}>
              <Download className="mr-2 h-4 w-4" />
              Export All Data (JSON)
            </Button>
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import Data (JSON)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Dropbox Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Automatically sync your data to Dropbox for easy sharing between devices.
          </p>
          <div className="flex gap-4">
            <Button onClick={handleDropboxUpload} disabled={dropboxSyncing}>
              {dropboxSyncing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload to Dropbox
            </Button>
            <Button variant="outline" onClick={handleOpenDropboxDialog}>
              <Download className="mr-2 h-4 w-4" />
              Download from Dropbox
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              Import data from a previously exported JSON file. Choose import mode:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Import Mode</Label>
            <Select value={importMode} onValueChange={(v) => setImportMode(v as 'merge' | 'replace')}>
              <SelectTrigger className="w-full mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merge">Merge (add/update records, keep existing)</SelectItem>
                <SelectItem value="replace">Replace (delete all, then import fresh)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Warning: "Replace" will delete ALL existing data before importing!
            </p>
          </div>
          <DialogFooter>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {importing ? 'Importing...' : 'Select JSON File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dropboxDialogOpen} onOpenChange={setDropboxDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dropbox Backups</DialogTitle>
            <DialogDescription>
              Select a backup file to download and import. The latest backup is selected by default.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-64 overflow-y-auto">
            {dropboxLoading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : dropboxFiles.length === 0 ? (
              <p className="text-center text-muted-foreground">No backup files found in Dropbox.</p>
            ) : (
              <div className="space-y-2">
                {dropboxFiles.map((file) => (
                  <div 
                    key={file.path} 
                    className="p-3 border rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => handleDropboxDownload(file.name)}
                  >
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDropboxDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
