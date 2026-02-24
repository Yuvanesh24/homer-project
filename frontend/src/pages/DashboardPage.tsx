import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { DashboardStats, DashboardActions } from '@/types';
import {
  Users,
  UserCheck,
  UserX,
  CheckCircle,
  Bell,
  AlertTriangle,
  Tablet,
  ArrowRight,
} from 'lucide-react';
import { formatDate, cn, getStatusColor } from '@/lib/utils';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [actions, setActions] = useState<DashboardActions | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllOverdue, setShowAllOverdue] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, actionsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/actions'),
        ]);
        setStats(statsRes.data);
        setActions(actionsRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link to="/patients/new">
          <Button>Add Patient</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalPatients || 0}</div>
            <p className="text-xs text-muted-foreground">
              Intervention: {stats?.interventionCount || 0} | Control: {stats?.controlCount || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Patients
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.activePatients || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently in study</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dropped Out
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats?.droppedOutPatients || 0}
            </div>
            <p className="text-xs text-muted-foreground">Withdrawn from study</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats?.completedPatients || 0}
            </div>
            <p className="text-xs text-muted-foreground">Trial completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Actions
            </CardTitle>
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.todayReminders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Actions
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats?.overdueReminders || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Devices In Use
            </CardTitle>
            <Tablet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.devicesInUse || 0} / 5
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming Events (Today & Tomorrow)
              </CardTitle>
              {actions?.upcomingEvents && actions.upcomingEvents.length > 5 && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                >
                  {showAllUpcoming ? 'Show Less' : 'View All'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {actions?.upcomingEvents && actions.upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {(showAllUpcoming ? actions.upcomingEvents : actions.upcomingEvents.slice(0, 5)).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{event.patient?.patientId}</p>
                      <p className="text-sm text-muted-foreground">{event.eventName}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={event.patient?.groupType === 'intervention' ? 'intervention' : 'control'}
                      >
                        Day {event.studyDay}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(event.scheduledDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No upcoming events
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue Events
              </CardTitle>
              {actions?.overdueEvents && actions.overdueEvents.length > 5 && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => setShowAllOverdue(!showAllOverdue)}
                >
                  {showAllOverdue ? 'Show Less' : 'View All'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {actions?.overdueEvents && actions.overdueEvents.length > 0 ? (
              <div className="space-y-3">
                {(showAllOverdue ? actions.overdueEvents : actions.overdueEvents.slice(0, 5)).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                  >
                    <div>
                      <p className="font-medium">{event.patient?.patientId}</p>
                      <p className="text-sm text-muted-foreground">{event.eventName}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="overdue">Overdue</Badge>
                      <p className="text-xs text-orange-600 mt-1">
                        {formatDate(event.scheduledDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No overdue events
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {actions?.expiringSims && actions.expiringSims.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Expiring SIM Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actions.expiringSims.map((sim) => (
                <div
                  key={sim.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg"
                >
                  <div>
                    <p className="font-medium">{sim.simNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {sim.modemNumber && <span className="font-medium">{sim.modemNumber}</span>}
                      {sim.modemNumber && ' - '}
                      {sim.provider.toUpperCase()}
                    </p>
                  </div>
                  <Badge variant="warning">Expires {formatDate(sim.expiryDate)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
