import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { Download, FileText, Users, AlertTriangle, Tablet } from 'lucide-react';

export function ReportsPage() {
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
