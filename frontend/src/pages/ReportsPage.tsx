import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { Patient } from '@/types';
import { Download, FileText, Users, AlertTriangle, Tablet } from 'lucide-react';

export function ReportsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

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
                    {patient.patientId} {patient.name ? `(${patient.name})` : ''}
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
    </div>
  );
}
