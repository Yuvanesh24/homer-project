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
import { Patient, StudyEvent, InterventionSession, ControlSession, AdverseEvent, IssueLog, PatientExercise } from '@/types';
import { formatDate, cn, getStudyDay } from '@/lib/utils';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
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
  const [exercises, setExercises] = useState<PatientExercise[]>([]);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [selectedMarsMechanisms, setSelectedMarsMechanisms] = useState<string[]>([]);
  const [selectedPlutoMechanisms, setSelectedPlutoMechanisms] = useState<string[]>([]);
  const [interventionAdlExercises, setInterventionAdlExercises] = useState<Record<string, string[]>>({});
  const [interventionAdlNotes, setInterventionAdlNotes] = useState('');
  const [controlExercises, setControlExercises] = useState<Record<string, string[]>>({});
  const [controlAdlExercises, setControlAdlExercises] = useState<Record<string, string[]>>({});
  const [controlAdlNotes, setControlAdlNotes] = useState('');
  const [controlNotes, setControlNotes] = useState('');

  useEffect(() => {
    fetchPatient();
    if (id) fetchExercises(id);
  }, [id]);

  const fetchExercises = async (patientId: string) => {
    try {
      const response = await api.get(`/exercises/patient/${patientId}`);
      setExercises(response.data);
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
    }
  };

  const saveExercises = async () => {
    if (!id || !patient) return;
    try {
      const currentStudyDay = getStudyDay(patient.studyStartDate);
      const payload: any = {
        patientId: id,
        groupType: patient.groupType,
        studyDay: currentStudyDay,
      };

      if (patient.groupType === 'intervention') {
        payload.marsMechanisms = JSON.stringify(selectedMarsMechanisms);
        payload.plutoMechanisms = JSON.stringify(selectedPlutoMechanisms);
        payload.adlNotes = JSON.stringify({ exercises: interventionAdlExercises, notes: interventionAdlNotes });
      } else {
        payload.controlExercises = JSON.stringify(controlExercises);
        payload.adlNotes = JSON.stringify({ exercises: controlAdlExercises, notes: controlAdlNotes });
        payload.notes = controlNotes;
      }

      const currentExercise = exercises.find(e => e.isCurrent);
      if (currentExercise) {
        await api.put(`/exercises/${currentExercise.id}`, payload);
      } else {
        await api.post('/exercises', payload);
      }
      
      fetchExercises(id);
      setExerciseDialogOpen(false);
      setSelectedMarsMechanisms([]);
      setSelectedPlutoMechanisms([]);
      setInterventionAdlExercises({});
      setInterventionAdlNotes('');
      setControlExercises({});
      setControlAdlExercises({});
      setControlAdlNotes('');
      setControlNotes('');
    } catch (error) {
      console.error('Failed to save exercises:', error);
    }
  };

  const openExerciseDialog = () => {
    const current = exercises.find(e => e.isCurrent);
    if (current) {
      try {
        setSelectedMarsMechanisms(current.marsMechanisms ? JSON.parse(current.marsMechanisms) : []);
        setSelectedPlutoMechanisms(current.plutoMechanisms ? JSON.parse(current.plutoMechanisms) : []);
        
        if (patient?.groupType === 'intervention' && current.adlNotes) {
          const adlData = JSON.parse(current.adlNotes);
          setInterventionAdlExercises(adlData.exercises || {});
          setInterventionAdlNotes(adlData.notes || '');
        } else if (patient?.groupType === 'control' && current.adlNotes) {
          const adlData = JSON.parse(current.adlNotes);
          setControlAdlExercises(adlData.exercises || {});
          setControlAdlNotes(adlData.notes || '');
        }
        
        setControlExercises(current.controlExercises ? JSON.parse(current.controlExercises) : {});
      } catch {
        setSelectedMarsMechanisms([]);
        setSelectedPlutoMechanisms([]);
        setInterventionAdlExercises({});
        setInterventionAdlNotes('');
        setControlExercises({});
        setControlAdlExercises({});
        setControlAdlNotes('');
        setControlNotes('');
      }
      setControlNotes(current.notes || '');
    }
    setExerciseDialogOpen(true);
  };

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
            {patient.name && <span className="text-lg text-muted-foreground">({patient.name})</span>}
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
          <TabsTrigger value="adverse">Adverse Events</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
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
                          ? (event.studyDay <= 0 ? 'A0' : event.studyDay === 30 ? 'A1' : 'A2')
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

        <TabsContent value="exercises">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {patient.groupType === 'intervention' ? 'Robotic Mechanisms & ADL' : 'Control Group Exercises'}
              </CardTitle>
              <Button onClick={openExerciseDialog}>
                <Plus className="mr-2 h-4 w-4" />
                {exercises.find(e => e.isCurrent) ? 'Update Exercises' : 'Log Exercises'}
              </Button>
            </CardHeader>
            <CardContent>
              {exercises.length > 0 ? (
                <div className="space-y-4">
                  {exercises.map((exercise, index) => (
                    <div key={exercise.id} className={`p-4 border rounded-lg ${exercise.isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={exercise.isCurrent ? 'default' : 'secondary'}>
                            {exercise.isCurrent ? 'Current' : `Previous (Day ${exercise.studyDay})`}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(exercise.effectiveFrom)}
                          </span>
                        </div>
                        {exercise.createdBy && (
                          <span className="text-xs text-muted-foreground">
                            By {exercise.createdBy.firstName} {exercise.createdBy.lastName}
                          </span>
                        )}
                      </div>
                      
                      {patient.groupType === 'intervention' ? (
                        <div className="space-y-2">
                          {exercise.marsMechanisms && JSON.parse(exercise.marsMechanisms).length > 0 && (
                            <div>
                              <span className="font-medium">MARS Mechanisms: </span>
                              {JSON.parse(exercise.marsMechanisms).join(', ')}
                            </div>
                          )}
                          {exercise.plutoMechanisms && JSON.parse(exercise.plutoMechanisms).length > 0 && (
                            <div>
                              <span className="font-medium">PLUTO Mechanisms: </span>
                              {JSON.parse(exercise.plutoMechanisms).join(', ')}
                            </div>
                          )}
                          {(!exercise.marsMechanisms || JSON.parse(exercise.marsMechanisms).length === 0) && 
                           (!exercise.plutoMechanisms || JSON.parse(exercise.plutoMechanisms).length === 0) && (
                            <span className="text-muted-foreground">No mechanisms assigned</span>
                          )}
                          <div className="border-t my-2 pt-2"></div>
                          {exercise.adlNotes && (() => {
                            try {
                              const adlData = JSON.parse(exercise.adlNotes);
                              return (
                                <>
                                  {adlData.exercises && Object.entries(adlData.exercises).map(([category, exList]) => (
                                    (exList as string[]).length > 0 && (
                                      <div key={category}>
                                        <span className="font-medium">ADL {category}: </span>
                                        {(exList as string[]).join(', ')}
                                      </div>
                                    )
                                  ))}
                                  {adlData.notes && (
                                    <div>
                                      <span className="font-medium">Notes: </span>
                                      {adlData.notes}
                                    </div>
                                  )}
                                </>
                              );
                            } catch {
                              return <div><span className="font-medium">ADL: </span>{exercise.adlNotes}</div>;
                            }
                          })()}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {exercise.controlExercises && Object.entries(JSON.parse(exercise.controlExercises)).map(([category, exList]) => (
                            <div key={category}>
                              <span className="font-medium">{category}: </span>
                              {(exList as string[]).join(', ')}
                            </div>
                          ))}
                          <div className="border-t my-2 pt-2"></div>
                          {exercise.adlNotes && (() => {
                            try {
                              const adlData = JSON.parse(exercise.adlNotes);
                              return (
                                <>
                                  {adlData.exercises && Object.entries(adlData.exercises).map(([category, exList]) => (
                                    (exList as string[]).length > 0 && (
                                      <div key={category}>
                                        <span className="font-medium">ADL {category}: </span>
                                        {(exList as string[]).join(', ')}
                                      </div>
                                    )
                                  ))}
                                  {adlData.notes && (
                                    <div>
                                      <span className="font-medium">Notes: </span>
                                      {adlData.notes}
                                    </div>
                                  )}
                                </>
                              );
                            } catch {
                              return <div><span className="font-medium">ADL: </span>{exercise.adlNotes}</div>;
                            }
                          })()}
                          {exercise.notes && (
                            <div>
                              <span className="font-medium">Notes: </span>
                              {exercise.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">No exercises logged yet</p>
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
              {selectedEvent?.eventName} - {selectedEvent?.eventType === 'assessment' 
                ? (selectedEvent?.studyDay <= 0 ? 'A0' : selectedEvent?.studyDay === 30 ? 'A1' : 'A2')
                : `Day ${selectedEvent?.studyDay}`}
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

      <Dialog open={exerciseDialogOpen} onOpenChange={setExerciseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {patient?.groupType === 'intervention' 
                ? 'Log Robotic Mechanisms & ADL' 
                : 'Log Control Group Exercises'}
            </DialogTitle>
            <DialogDescription>
              {patient?.groupType === 'intervention'
                ? 'Select the robotic mechanisms assigned to this patient'
                : 'Select the exercise categories and exercises for this patient specific'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {patient?.groupType === 'intervention' ? (
              <>
                <div className="space-y-2">
                  <Label className="font-semibold">MARS Mechanisms</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Medial Lateral', 'Anterior Posterior', 'MLAP'].map((mech) => (
                      <Button
                        key={mech}
                        variant={selectedMarsMechanisms.includes(mech) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (selectedMarsMechanisms.includes(mech)) {
                            setSelectedMarsMechanisms(selectedMarsMechanisms.filter(m => m !== mech));
                          } else {
                            setSelectedMarsMechanisms([...selectedMarsMechanisms, mech]);
                          }
                        }}
                      >
                        {mech}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">PLUTO Mechanisms</Label>
                  <div className="flex flex-wrap gap-2">
                    {['HOC', 'WURD', 'WFE', 'PS', 'FME'].map((mech) => (
                      <Button
                        key={mech}
                        variant={selectedPlutoMechanisms.includes(mech) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (selectedPlutoMechanisms.includes(mech)) {
                            setSelectedPlutoMechanisms(selectedPlutoMechanisms.filter(m => m !== mech));
                          } else {
                            setSelectedPlutoMechanisms([...selectedPlutoMechanisms, mech]);
                          }
                        }}
                      >
                        {mech}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4 mt-4">
                  <Label className="font-semibold mb-2 block">ADL Exercises</Label>
                  <ExerciseCategory 
                    category="ADL" 
                    selected={interventionAdlExercises['ADL'] || []}
                    onChange={(exercises) => setInterventionAdlExercises({...interventionAdlExercises, 'ADL': exercises})}
                  />
                  <div className="mt-4">
                    <Label className="font-semibold mb-2 block">Notes</Label>
                    <textarea
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={interventionAdlNotes}
                      onChange={(e) => setInterventionAdlNotes(e.target.value)}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {patient?.vcgAssignment === 'VCG2' && (
                  <>
                    <ExerciseCategory 
                      category="Unilateral" 
                      selected={controlExercises['Unilateral'] || []}
                      onChange={(exercises) => setControlExercises({...controlExercises, 'Unilateral': exercises})}
                    />
                    <ExerciseCategory 
                      category="Bilateral" 
                      selected={controlExercises['Bilateral'] || []}
                      onChange={(exercises) => setControlExercises({...controlExercises, 'Bilateral': exercises})}
                    />
                  </>
                )}
                {patient?.vcgAssignment === 'VCG3' && (
                  <>
                    <ExerciseCategory 
                      category="Unilateral" 
                      selected={controlExercises['Unilateral'] || []}
                      onChange={(exercises) => setControlExercises({...controlExercises, 'Unilateral': exercises})}
                    />
                    <ExerciseCategory 
                      category="Bilateral" 
                      selected={controlExercises['Bilateral'] || []}
                      onChange={(exercises) => setControlExercises({...controlExercises, 'Bilateral': exercises})}
                    />
                    <ExerciseCategory 
                      category="Scapular exercises" 
                      selected={controlExercises['Scapular exercises'] || []}
                      onChange={(exercises) => setControlExercises({...controlExercises, 'Scapular exercises': exercises})}
                    />
                  </>
                )}
                {patient?.vcgAssignment === 'VCG4_5' && (
                  <>
                    <ExerciseCategory 
                      category="Unilateral" 
                      selected={controlExercises['Unilateral'] || []}
                      onChange={(exercises) => setControlExercises({...controlExercises, 'Unilateral': exercises})}
                    />
                    <ExerciseCategory 
                      category="Bilateral" 
                      selected={controlExercises['Bilateral'] || []}
                      onChange={(exercises) => setControlExercises({...controlExercises, 'Bilateral': exercises})}
                    />
                  </>
                )}
                <div className="border-t pt-4 mt-4">
                  <Label className="font-semibold mb-2 block">ADL Exercises</Label>
                  <ExerciseCategory 
                    category="ADL" 
                    selected={controlAdlExercises['ADL'] || []}
                    onChange={(exercises) => setControlAdlExercises({...controlAdlExercises, 'ADL': exercises})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    value={controlNotes}
                    onChange={(e) => setControlNotes(e.target.value)}
                    placeholder="Enter exercise notes..."
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExerciseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveExercises}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExerciseCategory({ category, selected, onChange }: { category: string; selected: string[]; onChange: (exercises: string[]) => void }) {
  const [exercises, setExercises] = useState('');
  
  return (
    <div className="space-y-2 border p-3 rounded">
      <Label className="font-medium">{category}</Label>
      <div className="flex flex-wrap gap-2">
        {selected.map((ex) => (
          <Badge key={ex} variant="secondary" className="px-2 py-1">
            {ex}
            <button 
              className="ml-1 text-xs" 
              onClick={() => onChange(selected.filter(e => e !== ex))}
            >
              ×
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={exercises}
          onChange={(e) => setExercises(e.target.value)}
          placeholder={`Add ${category} exercise...`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && exercises.trim()) {
              if (!selected.includes(exercises.trim())) {
                onChange([...selected, exercises.trim()]);
              }
              setExercises('');
            }
          }}
        />
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            if (exercises.trim() && !selected.includes(exercises.trim())) {
              onChange([...selected, exercises.trim()]);
              setExercises('');
            }
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
