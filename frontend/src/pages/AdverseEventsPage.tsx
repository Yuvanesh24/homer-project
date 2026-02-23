import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { AdverseEvent, Patient } from '@/types';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function AdverseEventsPage() {
  const [events, setEvents] = useState<AdverseEvent[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    eventDate: new Date().toISOString().split('T')[0],
    studyDay: 0,
    eventType: '',
    severity: 'mild',
    description: '',
    actionTaken: '',
    reportedToPi: false,
    requiresDropout: false,
  });

  useEffect(() => {
    fetchEvents();
    fetchPatients();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/adverse-events');
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch adverse events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients?limit=100');
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const handleCreateEvent = async () => {
    if (!formData.patientId || !formData.eventType) {
      alert('Please fill required fields');
      return;
    }
    try {
      await api.post('/adverse-events', formData);
      fetchEvents();
      setDialogOpen(false);
      setFormData({
        patientId: '',
        eventDate: new Date().toISOString().split('T')[0],
        studyDay: 0,
        eventType: '',
        severity: 'mild',
        description: '',
        actionTaken: '',
        reportedToPi: false,
        requiresDropout: false,
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create adverse event');
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'mild':
        return <Badge variant="secondary">Mild</Badge>;
      case 'moderate':
        return <Badge variant="warning">Moderate</Badge>;
      case 'severe':
        return <Badge variant="destructive">Severe</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Adverse Events</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Log Adverse Event
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mild</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {events.filter((e) => e.severity === 'mild').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Moderate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {events.filter((e) => e.severity === 'moderate').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Severe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {events.filter((e) => e.severity === 'severe' || e.severity === 'life_threatening').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Adverse Events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reported to PI</TableHead>
                  <TableHead>Requires Dropout</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.patient?.patientId}</TableCell>
                    <TableCell>{formatDate(event.eventDate)}</TableCell>
                    <TableCell>Day {event.studyDay}</TableCell>
                    <TableCell>{event.eventType}</TableCell>
                    <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                    <TableCell className="max-w-xs truncate">{event.description || '-'}</TableCell>
                    <TableCell>{event.reportedToPi ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{event.requiresDropout ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={async () => {
                          if (confirm('Delete this adverse event?')) {
                            await api.delete(`/adverse-events/${event.id}`);
                            fetchEvents();
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && events.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No adverse events recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Add Adverse Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Adverse Event</DialogTitle>
            <DialogDescription>Record a new adverse event.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label>Patient *</Label>
              <Select value={formData.patientId} onValueChange={(v) => setFormData({ ...formData, patientId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.patientId}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Event Date</Label>
              <Input type="date" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Study Day</Label>
              <Input type="number" value={formData.studyDay} onChange={(e) => setFormData({ ...formData, studyDay: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Event Type *</Label>
              <Input 
                value={formData.eventType} 
                onChange={(e) => setFormData({ 
                  ...formData, 
                  eventType: e.target.value,
                  requiresDropout: e.target.value.toLowerCase() === 'dropout' ? true : formData.requiresDropout
                })} 
                placeholder="Enter event type" 
              />
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reported to PI</Label>
              <Select value={formData.reportedToPi ? 'yes' : 'no'} onValueChange={(v) => setFormData({ ...formData, reportedToPi: v === 'yes' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Requires Dropout</Label>
              <Select value={formData.requiresDropout ? 'yes' : 'no'} onValueChange={(v) => setFormData({ ...formData, requiresDropout: v === 'yes' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the event" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Action Taken</Label>
              <Input value={formData.actionTaken} onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })} placeholder="What action was taken" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateEvent}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
