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
import { DeviceSet, Patient, BackupActigraph } from '@/types';
import { Tablet, Plus, RefreshCw, UserPlus, Trash2, ArrowLeftRight } from 'lucide-react';
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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [backupActigraphs, setBackupActigraphs] = useState<BackupActigraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceSet | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [formData, setFormData] = useState({
    setNumber: '',
    marsDeviceId: '',
    plutoDeviceId: '',
    laptopNumber: '',
    modemSerial: '',
    actigraphLeftSerial: '',
    actigraphRightSerial: '',
  });
  const [backupFormData, setBackupFormData] = useState({
    name: '',
    leftSerial: '',
    rightSerial: '',
  });
  const [editingBackup, setEditingBackup] = useState<BackupActigraph | null>(null);

  useEffect(() => {
    fetchDevices();
    fetchPatients();
    fetchBackupActigraphs();
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

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients?limit=100');
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const fetchBackupActigraphs = async () => {
    try {
      const response = await api.get('/devices/backup-actigraphs');
      console.log('Backup actigraphs response:', response.data);
      setBackupActigraphs(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch backup actigraphs:', error.response?.data || error.message);
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
        actigraphLeftSerial: formData.actigraphLeftSerial || undefined,
        actigraphRightSerial: formData.actigraphRightSerial || undefined,
        setNumber: formData.setNumber ? parseInt(formData.setNumber as string) : undefined,
      };
      await api.post('/devices', payload);
      fetchDevices();
      setDialogOpen(false);
      setFormData({
        setNumber: '',
        marsDeviceId: '',
        plutoDeviceId: '',
        laptopNumber: '',
        modemSerial: '',
        actigraphLeftSerial: '',
        actigraphRightSerial: '',
      });
    } catch (error: any) {
      console.error('Device error:', error.response?.data);
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to create device';
      alert(typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg);
    }
  };

  const handleCreateBackup = async () => {
    console.log('Creating backup with data:', backupFormData);
    if (!backupFormData.name || !backupFormData.leftSerial || !backupFormData.rightSerial) {
      alert('Please fill in all fields');
      return;
    }
    try {
      const response = await api.post('/devices/backup-actigraphs', backupFormData);
      console.log('Create backup success:', response.data);
      await fetchBackupActigraphs();
      setBackupDialogOpen(false);
      setBackupFormData({ name: '', leftSerial: '', rightSerial: '' });
      alert('Backup pair added successfully!');
    } catch (error: any) {
      console.error('Create backup error:', error.response?.data || error.message);
      alert(error.response?.data?.error || 'Failed to create backup actigraph');
    }
  };

  const handleUpdateBackup = async () => {
    if (!editingBackup || !backupFormData.name || !backupFormData.leftSerial || !backupFormData.rightSerial) {
      return;
    }
    try {
      await api.put(`/devices/backup-actigraphs/${editingBackup.id}`, backupFormData);
      fetchBackupActigraphs();
      setBackupDialogOpen(false);
      setEditingBackup(null);
      setBackupFormData({ name: '', leftSerial: '', rightSerial: '' });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update backup actigraph');
    }
  };

  const handleDeleteBackup = async (backup: BackupActigraph) => {
    if (confirm(`Delete backup watch "${backup.name}"?`)) {
      try {
        await api.delete(`/devices/backup-actigraphs/${backup.id}`);
        fetchBackupActigraphs();
      } catch (error) {
        console.error('Failed to delete backup:', error);
      }
    }
  };

  const openBackupEdit = (backup: BackupActigraph) => {
    setEditingBackup(backup);
    setBackupFormData({
      name: backup.name,
      leftSerial: backup.leftSerial,
      rightSerial: backup.rightSerial,
    });
    setBackupDialogOpen(true);
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

  const handleSwapActigraphs = async (device: DeviceSet) => {
    const availableBackup = backupActigraphs.find(b => !b.isInUse);
    if (!availableBackup) {
      alert('No backup actigraphs available in the pool. Please add backup watches first.');
      return;
    }
    if (!confirm(`Swap actigraphs for this patient?\n\nCurrent: ${device.actigraphLeftSerial || '-'}/${device.actigraphRightSerial || '-'}\nWill receive: ${availableBackup.leftSerial}/${availableBackup.rightSerial}\n\nThe current watches will be returned to the backup pool.`)) {
      return;
    }
    try {
      const response = await api.post(`/devices/${device.id}/swap-actigraphs`);
      fetchDevices();
      fetchBackupActigraphs();
      alert(`Actigraphs swapped successfully!\nSwapped from: ${response.data.swappedFrom?.left || '-'}/${response.data.swappedFrom?.right || '-'}\nSwapped to: ${response.data.swappedTo?.left}/${response.data.swappedTo?.right}`);
    } catch (error: any) {
      console.error('Failed to swap actigraphs:', error);
      alert(error.response?.data?.error || 'Failed to swap actigraphs');
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
  const availableBackups = backupActigraphs.filter(b => !b.isInUse);
  const inUseBackup = backupActigraphs.find(b => b.isInUse);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Device Management</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Device
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <TableCell>{device.laptopNumber || '-'}</TableCell>
                    <TableCell>{device.modemSerial || '-'}</TableCell>
                    <TableCell>
                      {device.actigraphLeftSerial || '-'} / {device.actigraphRightSerial || '-'}
                    </TableCell>
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
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleSwapActigraphs(device)} disabled={availableBackups.length === 0} title={availableBackups.length === 0 ? "No backup watches available" : "Swap actigraphs (Day 15)"}>
                            <ArrowLeftRight className="mr-1 h-3 w-3" />
                            Swap
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleReturnDevice(device)}>
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Return
                          </Button>
                        </>
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

      {/* Backup Watches Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Backup Watches (For 15-Day Swap)</CardTitle>
          <Button variant="outline" size="sm" onClick={() => {
            setEditingBackup(null);
            setBackupFormData({ name: '', leftSerial: '', rightSerial: '' });
            setBackupDialogOpen(true);
          }}>
            <Plus className="mr-1 h-4 w-4" />
            Add Backup Pair
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            These backup actigraph watches can be swapped with patient's current watches on day 15.
            {inUseBackup && <span className="text-orange-600 ml-2">Currently in use: {inUseBackup.name}</span>}
          </p>
          {backupActigraphs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No backup watches added yet. Click "Add Backup Pair" to add watches for 15-day swaps.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Left Serial</TableHead>
                  <TableHead>Right Serial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupActigraphs.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="font-medium">{backup.name}</TableCell>
                    <TableCell>{backup.leftSerial}</TableCell>
                    <TableCell>{backup.rightSerial}</TableCell>
                    <TableCell>
                      {backup.isInUse ? (
                        <Badge variant="warning">In Use</Badge>
                      ) : (
                        <Badge variant="success">Available</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openBackupEdit(backup)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteBackup(backup)} className="text-red-600">
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Device</DialogTitle>
            <DialogDescription>Enter the device set details.</DialogDescription>
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
            <div className="space-y-2">
              <Label>Actigraph Left</Label>
              <Input
                value={formData.actigraphLeftSerial}
                onChange={(e) => setFormData({ ...formData, actigraphLeftSerial: e.target.value })}
                placeholder="e.g., A0"
              />
            </div>
            <div className="space-y-2">
              <Label>Actigraph Right</Label>
              <Input
                value={formData.actigraphRightSerial}
                onChange={(e) => setFormData({ ...formData, actigraphRightSerial: e.target.value })}
                placeholder="e.g., A1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDevice}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Actigraph Dialog */}
      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBackup ? 'Edit Backup Pair' : 'Add Backup Pair'}</DialogTitle>
            <DialogDescription>Add a pair of backup actigraph watches for 15-day swaps.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={backupFormData.name}
                onChange={(e) => setBackupFormData({ ...backupFormData, name: e.target.value })}
                placeholder="e.g., Backup Pair 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Left Serial</Label>
              <Input
                value={backupFormData.leftSerial}
                onChange={(e) => setBackupFormData({ ...backupFormData, leftSerial: e.target.value })}
                placeholder="e.g., B0"
              />
            </div>
            <div className="space-y-2">
              <Label>Right Serial</Label>
              <Input
                value={backupFormData.rightSerial}
                onChange={(e) => setBackupFormData({ ...backupFormData, rightSerial: e.target.value })}
                placeholder="e.g., B1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setBackupDialogOpen(false);
              setEditingBackup(null);
            }}>Cancel</Button>
            <Button onClick={editingBackup ? handleUpdateBackup : handleCreateBackup}>
              {editingBackup ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Device Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Device</DialogTitle>
            <DialogDescription>Select a patient to assign this device.</DialogDescription>
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
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignDevice} disabled={!selectedPatientId}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
