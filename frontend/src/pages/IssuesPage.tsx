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
import { IssueLog } from '@/types';
import { formatDate } from '@/lib/utils';
import { Phone } from 'lucide-react';

export function IssuesPage() {
  const [issues, setIssues] = useState<IssueLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issue / Call Logs</h1>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
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
    </div>
  );
}
