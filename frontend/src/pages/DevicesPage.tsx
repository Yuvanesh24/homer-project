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
import { DeviceSet, Patient, ActigraphWatch } from '@/types';
import { Plus, RefreshCw, UserPlus, Trash2, ArrowLeftRight } from 'lucide-react';
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
  const [watches, setWatches] = useState<ActigraphWatch[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [watchDialogOpen, setWatchDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceSet | null>(null);
  const [selectedWatch, setSelectedWatch] = useState<ActigraphWatch | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [editingWatch, setEditingWatch] = useState<ActigraphWatch | null>(null);
  const [formData, setFormData] = useState({
    setNumber: '',
    marsDeviceId: '',
    plutoDeviceId: '',
    laptopNumber: '',
    modemSerial: '',
  });
  const [watchFormData, setWatchFormData] = useState({
    name: '',
    leftSerial: '',
    rightSerial: '',
    isBackup: false,
  });

  useEffect(() => {
    fetchDevices();
    fetchWatches();
    fetchPatients();
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

  const fetchWatches = async () => {
    try {
      const response = await api.get('/watches');
      setWatches(response.data || []);
    } catch (error) {
      console.error('Failed to fetch watches:', error);
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

  const handleCreateDevice = async () => {
    if (!formData.marsDeviceId || !formData.plutoDeviceId) {
      alert('Please fill in required fields (MARS ID and PLUTO ID)');
      return;
    }
    try {
      const payload = {
        marsDeviceId: formData.marsDeviceId,
        plutoDeviceId: formData.plutoDeviceId,
        laptopNumber: formData.laptopNumber || undefined,
        modemSerial: formData.modemSerial || undefined,
        setNumber: formData.setNumber ? parseInt(formData.setNumber as string) : undefined,
      };
      await api.post('/devices', payload);
      fetchDevices();
      setDeviceDialogOpen(false);
      setFormData({
        setNumber: '',
        marsDeviceId: '',
        plutoDeviceId: '',
        laptopNumber: '',
        modemSerial: '',
      });
    } catch (error: any) {
      console.error('Device error:', error.response?.data);
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to create device';
      alert(typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg);
    }
  };

  const handleCreateWatch = async () => {
    if (!watchFormData.name || !watchFormData.leftSerial || !watchFormData.rightSerial) {
      alert('Please fill in all fields');
      return;
    }
    try {
      await api.post('/watches', watchFormData);
      fetchWatches();
      setWatchDialogOpen(false);
      setWatchFormData({ name: '', leftSerial: '', rightSerial: '', isBackup: false });
      setEditingWatch(null);
      alert('Watch added successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create watch');
    }
  };

  const handleUpdateWatch = async () => {
    if (!editingWatch || !watchFormData.name || !watchFormData.leftSerial || !watchFormData.rightSerial) {
      return;
    }
    try {
      await api.put(`/watches/${editingWatch.id}`, watchFormData);
      fetchWatches();
      setWatchDialogOpen(false);
      setEditingWatch(null);
      setWatchFormData({ name: '', leftSerial: '', rightSerial: '', isBackup: false });
      alert('Watch updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update watch');
    }
  };

  const handleDeleteWatch = async (watch: ActigraphWatch) => {
    if (confirm(`Delete watch "${watch.name}"?`)) {
      try {
        await api.delete(`/watches/${watch.id}`);
        fetchWatches();
      } catch (error) {
        console.error('Failed to delete watch:', error);
      }
    }
  };

  const handleAssignWatch = async () => {
    if (!selectedWatch || !selectedPatientId) return;
    try {
      await api.post(`/watches/${selectedWatch.id}/assign`, { patientId: selectedPatientId });
      fetchWatches();
      setAssignDialogOpen(false);
      setSelectedWatch(null);
      setSelectedPatientId('');
      alert('Watch assigned successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to assign watch');
    }
  };

  const handleUnassignWatch = async (watch: ActigraphWatch) => {
    if (!confirm(`Unassign watch from patient?`)) return;
    try {
      await api.post(`/watches/${watch.id}/unassign`);
      fetchWatches();
      alert('Watch unassigned successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to unassign watch');
    }
  };

  const handleSwapWatch = async (watch: ActigraphWatch) => {
    if (!confirm(`Swap this watch with a backup watch?`)) return;
    try {
      const response = await api.post(`/watches/${watch.id}/swap`);
      fetchWatches();
      alert(`Swap successful!\nOld: ${response.data.oldWatch}\nNew: ${response.data.newWatch}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to swap watch');
    }
  };

  const handleAssignDevice = async () => {
    if (!selectedDevice || !selectedPatientId) return;
    try {
      await api.post(`/devices/${selectedDevice.id}/assign`, { patientId: selectedPatientId });
      fetchDevices();
      setAssignDialogOpen(false);
      setSelectedDevice(null);
      setSelectedPatientId('');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to assign device');
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

  const handleDeleteDevice = async (device: DeviceSet) => {
    if (confirm('Are you sure you want to delete this device?')) {
      try {
        await api.delete(`/devices/${device.id}`);
        fetchDevices();
      } catch (error) {
        console.error('Failed to delete device:', error);
      }
    }
  };

  const openAssignDialog = (device: DeviceSet) => {
    setSelectedDevice(device);
    setAssignDialogOpen(true);
  };

  const openWatchAssign = (watch: ActigraphWatch) => {
    setSelectedWatch(watch);
    setAssignDialogOpen(true);
  };

  const openWatchEdit = (watch: ActigraphWatch) => {
    setEditingWatch(watch);
    setWatchFormData({
      name: watch.name,
      leftSerial: watch.leftSerial,
      rightSerial: watch.rightSerial,
      isBackup: watch.isBackup,
    });
    setWatchDialogOpen(true);
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

  const availablePatients = patients.filter(p => p.status === 'active');
  const assignedWatches = watches.filter(w => w.assignedPatientId);
  const availableWatches = watches.filter(w => !w.assignedPatientId && !w.isBackup);
  const backupWatches = watches.filter(w => w.isBackup && !w.assignedPatientId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Device & Watch Management</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setWatchDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Watch
          </Button>
          <Button onClick={() => setDeviceDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Device
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Devices Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {devices.filter((d) => d.status === 'available').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Watches Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{watches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Watches Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{assignedWatches.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Device Sets Section */}
      <Card>
        <CardHeader>
          <CardTitle>Device Sets (For Intervention Patients)</CardTitle>
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
                    <TableCell>{device.laptopNumber || '-'}</TableCell>
                    <TableCell>{device.modemSerial || '-'}</TableCell>
                    <TableCell>{getStatusBadge(device.status)}</TableCell>
                    <TableCell>
                      {device.patient ? `${device.patient.patientId}${device.patient.name ? ` (${device.patient.name})` : ''}` : '-'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {device.status === 'available' && (
                        <Button variant="outline" size="sm" onClick={() => openAssignDialog(device)}>
                          <UserPlus className="mr-1 h-3 w-3" />
                          Assign
                        </Button>
                      )}
                      {device.status === 'in_use' && (
                        <Button variant="outline" size="sm" onClick={() => handleReturnDevice(device)}>
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Return
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDevice(device)} className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Actigraph Watches Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Actigraph Watches (For All Patients)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage actigraph watches here. Assign to intervention or control patients. Use swap for 15-day rotation.
          </p>
          
          {watches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No watches added yet. Click "Add Watch" to add actigraph watches.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Left Serial</TableHead>
                  <TableHead>Right Serial</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watches.map((watch) => (
                  <TableRow key={watch.id}>
                    <TableCell className="font-medium">{watch.name}</TableCell>
                    <TableCell>{watch.leftSerial}</TableCell>
                    <TableCell>{watch.rightSerial}</TableCell>
                    <TableCell>
                      {watch.isBackup ? (
                        <Badge variant="outline">Backup</Badge>
                      ) : watch.assignedPatientId ? (
                        <Badge variant="default">Assigned</Badge>
                      ) : (
                        <Badge variant="success">Available</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {watch.patient ? (
                        <span className="text-blue-600">{watch.patient.patientId} - {watch.patient.name || '(No name)'}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {!watch.assignedPatientId && !watch.isBackup && (
                        <Button variant="outline" size="sm" onClick={() => openWatchAssign(watch)}>
                          <UserPlus className="mr-1 h-3 w-3" />
                          Assign
                        </Button>
                      )}
                      {watch.assignedPatientId && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleSwapWatch(watch)} disabled={backupWatches.length === 0} title={backupWatches.length === 0 ? "No backup watches available" : "Swap for day 15"}>
                            <ArrowLeftRight className="mr-1 h-3 w-3" />
                            Swap
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleUnassignWatch(watch)}>
                            Unassign
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openWatchEdit(watch)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteWatch(watch)} className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Device Dialog */}
      <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Device Set</DialogTitle>
            <DialogDescription>Enter device set details (MARS, PLUTO, Laptop, Modem).</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Set Number</Label>
              <Input
                type="number"
                min={1}
                value={formData.setNumber}
                onChange={(e) => setFormData({ ...formData, setNumber: e.target.value })}
                placeholder="Auto-generated if empty"
              />
            </div>
            <div className="space-y-2">
              <Label>MARS Device ID *</Label>
              <Input
                value={formData.marsDeviceId}
                onChange={(e) => setFormData({ ...formData, marsDeviceId: e.target.value })}
                placeholder="e.g., MARS-001"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>PLUTO Device ID *</Label>
              <Input
                value={formData.plutoDeviceId}
                onChange={(e) => setFormData({ ...formData, plutoDeviceId: e.target.value })}
                placeholder="e.g., PLUTO-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Laptop</Label>
              <Input
                value={formData.laptopNumber}
                onChange={(e) => setFormData({ ...formData, laptopNumber: e.target.value })}
                placeholder="e.g., LAP-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Modem</Label>
              <Input
                value={formData.modemSerial}
                onChange={(e) => setFormData({ ...formData, modemSerial: e.target.value })}
                placeholder="e.g., MODEM-001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeviceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDevice}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Watch Dialog */}
      <Dialog open={watchDialogOpen} onOpenChange={setWatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWatch ? 'Edit Watch' : 'Add Watch'}</DialogTitle>
            <DialogDescription>
              {editingWatch ? 'Update watch details.' : 'Add a pair of actigraph watches.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={watchFormData.name}
                onChange={(e) => setWatchFormData({ ...watchFormData, name: e.target.value })}
                placeholder="e.g., Watch Pair 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Left Serial</Label>
              <Input
                value={watchFormData.leftSerial}
                onChange={(e) => setWatchFormData({ ...watchFormData, leftSerial: e.target.value })}
                placeholder="e.g., A0"
              />
            </div>
            <div className="space-y-2">
              <Label>Right Serial</Label>
              <Input
                value={watchFormData.rightSerial}
                onChange={(e) => setWatchFormData({ ...watchFormData, rightSerial: e.target.value })}
                placeholder="e.g., A1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isBackup"
                checked={watchFormData.isBackup}
                onChange={(e) => setWatchFormData({ ...watchFormData, isBackup: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isBackup" className="text-sm">Mark as Backup (for 15-day swap)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setWatchDialogOpen(false);
              setEditingWatch(null);
              setWatchFormData({ name: '', leftSerial: '', rightSerial: '', isBackup: false });
            }}>Cancel</Button>
            <Button onClick={editingWatch ? handleUpdateWatch : handleCreateWatch}>
              {editingWatch ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog (for both device and watch) */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {selectedDevice ? 'Device' : 'Watch'}</DialogTitle>
            <DialogDescription>Select a patient to assign this {selectedDevice ? 'device' : 'watch'}.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Select Patient</Label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {availablePatients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.patientId} - {patient.name || '(No name)'} - {patient.groupType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAssignDialogOpen(false);
              setSelectedDevice(null);
              setSelectedWatch(null);
            }}>Cancel</Button>
            <Button onClick={selectedDevice ? handleAssignDevice : handleAssignWatch} disabled={!selectedPatientId}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
