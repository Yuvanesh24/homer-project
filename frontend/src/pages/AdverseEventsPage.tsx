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
import { AdverseEvent } from '@/types';
import { formatDate } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

export function AdverseEventsPage() {
  const [events, setEvents] = useState<AdverseEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
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

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'minor':
        return <Badge variant="secondary">Minor</Badge>;
      case 'moderate':
        return <Badge variant="warning">Moderate</Badge>;
      case 'severe':
        return <Badge variant="destructive">Severe</Badge>;
      case 'life_threatening':
        return <Badge variant="destructive">Life-threatening</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Adverse Events</h1>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Minor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {events.filter((e) => e.severity === 'minor').length}
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
    </div>
  );
}
