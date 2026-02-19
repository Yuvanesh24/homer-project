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
import { Reminder } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import { Bell, CheckCircle } from 'lucide-react';

export function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');

  useEffect(() => {
    fetchReminders();
  }, [filter]);

  const fetchReminders = async () => {
    try {
      const response = await api.get(`/reminders?isCompleted=${filter === 'completed'}`);
      setReminders(response.data);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeReminder = async (id: string) => {
    try {
      await api.put(`/reminders/${id}/complete`);
      fetchReminders();
    } catch (error) {
      console.error('Failed to complete reminder:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reminders</h1>
        <div className="flex gap-2">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {reminders.filter((r) => !r.isCompleted).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {reminders.filter(
                (r) =>
                  !r.isCompleted &&
                  new Date(r.dueDate).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {reminders.filter(
                (r) => !r.isCompleted && new Date(r.dueDate) < new Date()
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reminders</CardTitle>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => (
                  <TableRow
                    key={reminder.id}
                    className={cn(
                      !reminder.isCompleted && new Date(reminder.dueDate) < new Date() && 'bg-red-50'
                    )}
                  >
                    <TableCell className="font-medium">
                      {reminder.patient?.patientId || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{reminder.reminderType}</Badge>
                    </TableCell>
                    <TableCell>{reminder.title}</TableCell>
                    <TableCell>{formatDate(reminder.dueDate)}</TableCell>
                    <TableCell>
                      {reminder.isCompleted ? (
                        <Badge variant="success">Completed</Badge>
                      ) : new Date(reminder.dueDate) < new Date() ? (
                        <Badge variant="destructive">Overdue</Badge>
                      ) : (
                        <Badge variant="pending">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!reminder.isCompleted && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => completeReminder(reminder.id)}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && reminders.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No reminders</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
