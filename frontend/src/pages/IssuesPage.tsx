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
import { IssueLog, Patient } from '@/types';
import { formatDate } from '@/lib/utils';
import { Phone, Plus } from 'lucide-react';
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

export function IssuesPage() {
  const [issues, setIssues] = useState<IssueLog[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    contactDate: new Date().toISOString(),
    contactType: 'phone' as 'phone' | 'home_visit',
    durationMinutes: 0,
    issueType: 'technical' as 'technical' | 'medical' | 'scheduling' | 'other',
    issueDescription: '',
    rootCause: '',
    solutionProvided: '',
    followUpRequired: false,
    followUpDate: '',
  });

  useEffect(() => {
    fetchIssues();
    fetchPatients();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await api.get('/issues');
      setIssues(response.data);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
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

  const handleCreateIssue = async () => {
    if (!formData.patientId || !formData.issueType) {
      alert('Please fill required fields');
      return;
    }
    try {
      await api.post('/issues', formData);
      fetchIssues();
      setDialogOpen(false);
      setFormData({
        patientId: '',
        contactDate: new Date().toISOString(),
        contactType: 'phone',
        durationMinutes: 0,
        issueType: 'technical',
        issueDescription: '',
        rootCause: '',
        solutionProvided: '',
        followUpRequired: false,
        followUpDate: '',
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create issue');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issue / Call Logs</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Log Issue
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{issues.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Technical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {issues.filter((i) => i.issueType === 'technical').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Medical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {issues.filter((i) => i.issueType === 'medical').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {issues.filter((i) => i.followUpRequired).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Issue Logs</CardTitle>
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
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Contact Type</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Solution</TableHead>
                  <TableHead>Follow-up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">{issue.patient?.patientId}</TableCell>
                    <TableCell>{formatDate(issue.contactDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{issue.contactType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={issue.issueType === 'technical' ? 'info' : 'secondary'}>
                        {issue.issueType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{issue.issueDescription || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{issue.solutionProvided || '-'}</TableCell>
                    <TableCell>
                      {issue.followUpRequired ? (
                        <Badge variant="warning">Due {formatDate(issue.followUpDate!)}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && issues.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No issue logs recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Add Issue Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Issue / Call</DialogTitle>
            <DialogDescription>Record a new issue or call from a patient.</DialogDescription>
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
              <Label>Contact Date & Time</Label>
              <Input type="datetime-local" value={formData.contactDate.slice(0, 16)} onChange={(e) => setFormData({ ...formData, contactDate: new Date(e.target.value).toISOString() })} />
            </div>
            <div className="space-y-2">
              <Label>Contact Type</Label>
              <Select value={formData.contactType} onValueChange={(v) => setFormData({ ...formData, contactType: v as 'phone' | 'home_visit' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="home_visit">Home Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input type="number" value={formData.durationMinutes} onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Issue Type *</Label>
              <Select value={formData.issueType} onValueChange={(v) => setFormData({ ...formData, issueType: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="scheduling">Scheduling</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Issue Description</Label>
              <Input value={formData.issueDescription} onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })} placeholder="Describe the issue" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Root Cause</Label>
              <Input value={formData.rootCause} onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })} placeholder="Root cause of the issue" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Solution Provided</Label>
              <Input value={formData.solutionProvided} onChange={(e) => setFormData({ ...formData, solutionProvided: e.target.value })} placeholder="Solution provided" />
            </div>
            <div className="space-y-2">
              <Label>Follow-up Required</Label>
              <Select value={formData.followUpRequired ? 'yes' : 'no'} onValueChange={(v) => setFormData({ ...formData, followUpRequired: v === 'yes' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.followUpRequired && (
              <div className="space-y-2">
                <Label>Follow-up Date</Label>
                <Input type="date" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateIssue}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
