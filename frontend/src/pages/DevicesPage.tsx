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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { DeviceSet } from '@/types';
import { formatDate } from '@/lib/utils';
import { Tablet, Plus, RefreshCw } from 'lucide-react';
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

export function DevicesPage() {
  const [devices, setDevices] = useState<DeviceSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceSet | null>(null);
  const [formData, setFormData] = useState({
    setNumber: 1,
    marsDeviceId: '',
    plutoDeviceId: '',
    laptopNumber: '',
    modemSerial: '',
    actigraphLeftSerial: '',
    actigraphRightSerial: '',
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await api.get('/devices');
      setDevices(response.data);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDevice = async () => {
    try {
      await api.post('/devices', formData);
      fetchDevices();
      setDialogOpen(false);
      setFormData({
        setNumber: 1,
        marsDeviceId: '',
        plutoDeviceId: '',
        laptopNumber: '',
        modemSerial: '',
        actigraphLeftSerial: '',
        actigraphRightSerial: '',
      });
    } catch (error) {
      console.error('Failed to create device:', error);
    }
  };

  const handleReturnDevice = async (device: DeviceSet) => {
    try {
      await api.post(`/devices/${device.id}/return`);
      fetchDevices();
    } catch (error) {
      console.error('Failed to return device:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="success">Available</Badge>;
      case 'in_use':
        return <Badge variant="warning">In Use</Badge>;
      case 'under_maintenance':
        return <Badge variant="destructive">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Device Management</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Device Set
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {devices.filter((d) => d.status === 'available').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {devices.filter((d) => d.status === 'in_use').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Sets</CardTitle>
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
                  <TableHead>Set #</TableHead>
                  <TableHead>MARS ID</TableHead>
                  <TableHead>PLUTO ID</TableHead>
                  <TableHead>Laptop</TableHead>
                  <TableHead>Modem</TableHead>
                  <TableHead>Actigraph (L/R)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.setNumber}</TableCell>
                    <TableCell>{device.marsDeviceId}</TableCell>
                    <TableCell>{device.plutoDeviceId}</TableCell>
                    <TableCell>{device.laptopNumber}</TableCell>
                    <TableCell>{device.modemSerial}</TableCell>
                    <TableCell>
                      {device.actigraphLeftSerial} / {device.actigraphRightSerial}
                    </TableCell>
                    <TableCell>{getStatusBadge(device.status)}</TableCell>
                    <TableCell>
                      {device.patient ? (
                        <span className="font-medium">{device.patient.patientId}</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {device.status === 'in_use' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReturnDevice(device)}
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Device Set</DialogTitle>
            <DialogDescription>
              Enter the details for the new device set.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Set Number</Label>
              <Select
                value={String(formData.setNumber)}
                onValueChange={(v) => setFormData({ ...formData, setNumber: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      Set {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>MARS Device ID</Label>
              <Input
                value={formData.marsDeviceId}
                onChange={(e) => setFormData({ ...formData, marsDeviceId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>PLUTO Device ID</Label>
              <Input
                value={formData.plutoDeviceId}
                onChange={(e) => setFormData({ ...formData, plutoDeviceId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Laptop Number</Label>
              <Input
                value={formData.laptopNumber}
                onChange={(e) => setFormData({ ...formData, laptopNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Modem Serial</Label>
              <Input
                value={formData.modemSerial}
                onChange={(e) => setFormData({ ...formData, modemSerial: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Actigraph Left Serial</Label>
              <Input
                value={formData.actigraphLeftSerial}
                onChange={(e) => setFormData({ ...formData, actigraphLeftSerial: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Actigraph Right Serial</Label>
              <Input
                value={formData.actigraphRightSerial}
                onChange={(e) => setFormData({ ...formData, actigraphRightSerial: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDevice}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
