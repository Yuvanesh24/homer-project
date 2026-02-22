import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { Patient, StudyEvent, InterventionSession, ControlSession, AdverseEvent, IssueLog } from '@/types';
import { formatDate, cn, getStudyDay } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
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

export function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<StudyEvent | null>(null);
  const [eventNotes, setEventNotes] = useState('');
  const [eventStatus, setEventStatus] = useState<string>('completed');

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      const response = await api.get(`/patients/${id}`);
      setPatient(response.data);
    } catch (error) {
      console.error('Failed to fetch patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: StudyEvent) => {
    setSelectedEvent(event);
    setEventNotes(event.notes || '');
    setEventStatus(event.status);
    setEventDialogOpen(true);
  };

  const updateEventStatus = async () => {
    if (!selectedEvent) return;
    try {
      await api.put(`/events/${selectedEvent.id}`, {
        status: eventStatus,
        notes: eventNotes,
      });
      fetchPatient();
      setEventDialogOpen(false);
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleDropout = async () => {
    if (!patient) return;
    const reason = prompt('Enter dropout reason:');
    if (!reason) return;
    try {
      await api.post(`/patients/${patient.id}/dropout`, {
        dropoutDate: new Date().toISOString().split('T')[0],
        dropoutReason: reason,
        dropoutReasonType: 'Manual',
      });
      fetchPatient();
    } catch (error) {
      console.error('Failed to record dropout:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'completed':
        return <Badge variant="info">Completed</Badge>;
      case 'dropped_out':
        return <Badge variant="error">Dropped Out</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEventStatusBadge = (event: StudyEvent) => {
    const today = new Date();
    const scheduledDate = new Date(event.scheduledDate);
    const isOverdue = scheduledDate < today && event.status === 'pending';

    if (event.status === 'completed') return <Badge variant="success">Completed</Badge>;
    if (event.status === 'cancelled') return <Badge variant="secondary">Cancelled</Badge>;
    if (event.status === 'skipped') return <Badge variant="outline">Skipped</Badge>;
    if (isOverdue) return <Badge variant="warning">Overdue</Badge>;
    return <Badge variant="pending">Pending</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <p>Patient not found</p>
      </div>
    );
  }

  const currentStudyDay = getStudyDay(patient.studyStartDate);

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/patients')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Patients
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{patient.patientId}</h1>
            <Badge variant={patient.groupType === 'intervention' ? 'intervention' : 'control'}>
              {patient.groupType === 'intervention' ? 'Intervention' : 'Control'}
            </Badge>
            {getStatusBadge(patient.status)}
          </div>
          <p className="text-muted-foreground mt-1">
            Day {currentStudyDay} of study • Started {formatDate(patient.studyStartDate)}
          </p>
        </div>
        <div className="flex gap-2">
          {patient.status === 'active' && (
            <>
              <Button variant="default" onClick={async () => {
                if (confirm('Mark this patient as completed?')) {
                  await api.put(`/patients/${patient.id}`, { status: 'completed' });
                  fetchPatient();
                }
              }}>
                Mark as Completed
              </Button>
              <Button variant="destructive" onClick={handleDropout}>
                Mark as Dropped Out
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Patient Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p><span className="font-medium">Age:</span> {patient.age}</p>
              <p><span className="font-medium">Hand:</span> {patient.affectedHand}</p>
              {patient.vcgAssignment && (
                <p><span className="font-medium">VCG:</span> {patient.vcgAssignment}</p>
              )}
              <p><span className="font-medium">Phone:</span> {patient.phoneNumber || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Study Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p><span className="font-medium">A0 (Baseline):</span> {patient.a0Date ? formatDate(patient.a0Date) : 'Not set'}</p>
              <p><span className="font-medium">Study Start:</span> {formatDate(patient.studyStartDate)}</p>
              <p><span className="font-medium">Enrollment:</span> {formatDate(patient.enrollmentDate)}</p>
              {patient.dropoutDate && (
                <p><span className="font-medium">Dropout:</span> {formatDate(patient.dropoutDate)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Device Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.deviceSet ? (
              <div className="space-y-1">
                <p><span className="font-medium">Set:</span> {patient.deviceSet.setNumber}</p>
                <p><span className="font-medium">MARS:</span> {patient.deviceSet.marsDeviceId}</p>
                <p><span className="font-medium">PLUTO:</span> {patient.deviceSet.plutoDeviceId}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No device assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="adverse">Adverse Events</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Study Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completion Date</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient.studyEvents?.map((event) => (
                    <TableRow
                      key={event.id}
                      className={cn(
                        event.status === 'pending' &&
                        new Date(event.scheduledDate) < new Date() &&
                        'bg-orange-50'
                      )}
                    >
                      <TableCell className="font-medium">
                        {event.eventType === 'assessment' 
                          ? (event.studyDay === -1 ? 'A0' : event.studyDay === 30 ? 'A1' : 'A2')
                          : `Day ${event.studyDay}`}
                      </TableCell>
                      <TableCell>{event.eventName}</TableCell>
                      <TableCell>{formatDate(event.scheduledDate)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEventClick(event)}
                        >
                          {getEventStatusBadge(event)}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {event.completionDate ? formatDate(event.completionDate) : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {event.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>
                {patient.groupType === 'intervention' ? 'Intervention Sessions' : 'Control Sessions'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patient.groupType === 'intervention' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Robotic Score</TableHead>
                      <TableHead>Exercises</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.interventionSessions?.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>{formatDate(session.sessionDate)}</TableCell>
                        <TableCell>Day {session.studyDay}</TableCell>
                        <TableCell>{session.durationMinutes || '-'} min</TableCell>
                        <TableCell>{session.roboticAssessmentScore || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {session.exercisesPerformed || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Exercises</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.controlSessions?.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>{formatDate(session.sessionDate)}</TableCell>
                        <TableCell>Day {session.studyDay}</TableCell>
                        <TableCell>{session.durationMinutes || '-'} min</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {session.manualExercisesGiven || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {((patient.groupType === 'intervention' && !patient.interventionSessions?.length) ||
                (patient.groupType === 'control' && !patient.controlSessions?.length)) && (
                <p className="text-center py-4 text-muted-foreground">No sessions recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adverse">
          <Card>
            <CardHeader>
              <CardTitle>Adverse Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reported to PI</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient.adverseEvents?.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{formatDate(event.eventDate)}</TableCell>
                      <TableCell>Day {event.studyDay}</TableCell>
                      <TableCell>{event.eventType}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            event.severity === 'severe' || event.severity === 'life_threatening'
                              ? 'destructive'
                              : event.severity === 'moderate'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {event.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{event.description || '-'}</TableCell>
                      <TableCell>{event.reportedToPi ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={async () => {
                            if (confirm('Delete this adverse event?')) {
                              await api.delete(`/adverse-events/${event.id}`);
                              fetchPatient();
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
              {!patient.adverseEvents?.length && (
                <p className="text-center py-4 text-muted-foreground">No adverse events recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>Issue/Call Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Solution</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient.issueLogs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDate(log.contactDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.contactType}</Badge>
                      </TableCell>
                      <TableCell>{log.issueType}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.issueDescription || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.solutionProvided || '-'}</TableCell>
                      <TableCell>
                        {log.followUpRequired ? (
                          <Badge variant="warning">Due {log.followUpDate ? formatDate(log.followUpDate) : '-'}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={async () => {
                            if (confirm('Delete this issue log?')) {
                              await api.delete(`/issues/${log.id}`);
                              fetchPatient();
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
              {!patient.issueLogs?.length && (
                <p className="text-center py-4 text-muted-foreground">No issue logs recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Event Status</DialogTitle>
            <DialogDescription>
              {selectedEvent?.eventName} - {selectedEvent?.studyDay === -1 ? 'A0' : selectedEvent?.studyDay === 30 ? 'A1' : selectedEvent?.studyDay === 180 ? 'A2' : `Day ${selectedEvent?.studyDay}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={eventStatus} onValueChange={setEventStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={eventNotes}
                onChange={(e) => setEventNotes(e.target.value)}
                placeholder="Add notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateEventStatus}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
