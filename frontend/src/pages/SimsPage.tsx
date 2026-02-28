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
import { SimCard } from '@/types';
import { formatDate } from '@/lib/utils';
import { Smartphone, Plus, AlertTriangle, Trash2 } from 'lucide-react';
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

export function SimsPage() {
  const [sims, setSims] = useState<SimCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [selectedSim, setSelectedSim] = useState<SimCard | null>(null);
  const [formData, setFormData] = useState({
    simNumber: '',
    modemNumber: '',
    provider: 'airtel' as 'airtel' | 'jio',
  });
  const [rechargeData, setRechargeData] = useState({
    rechargeDate: new Date().toISOString().split('T')[0],
    durationDays: 180,
  });

  useEffect(() => {
    fetchSims();
  }, []);

  const fetchSims = async () => {
    try {
      const response = await api.get('/sims');
      setSims(response.data);
    } catch (error) {
      console.error('Failed to fetch SIMs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSim = async () => {
    if (!formData.simNumber) {
      alert('Please enter SIM number');
      return;
    }
    try {
      await api.post('/sims', formData);
      fetchSims();
      setDialogOpen(false);
      setFormData({ simNumber: '', modemNumber: '', provider: 'airtel' });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create SIM');
    }
  };

  const handleRecharge = async () => {
    if (!selectedSim) return;
    try {
      await api.post(`/sims/${selectedSim.id}/recharge`, rechargeData);
      setRechargeDialogOpen(false);
      setSelectedSim(null);
      fetchSims(); // Refresh after recharge
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to recharge SIM');
    }
  };

const handleDeleteSim = async (sim: SimCard) => {
    if (confirm('Deactivate this SIM? (You can reactivate later)')) {
      try {
        await api.delete(`/sims/${sim.id}`);
        fetchSims();
      } catch (error) {
        console.error('Failed to delete SIM:', error);
      }
    }
  };

  const handlePermanentDelete = async (sim: SimCard) => {
    if (confirm(`PERMANENTLY delete SIM ${sim.simNumber}? This will allow you to add a new SIM with the same number.`)) {
      try {
        await api.delete(`/sims/${sim.id}/force`);
        fetchSims();
      } catch (error) {
        console.error('Failed to delete SIM:', error);
      }
    }
  };
  };

  const openRechargeDialog = (sim: SimCard) => {
    setSelectedSim(sim);
    setRechargeData({
      rechargeDate: new Date().toISOString().split('T')[0],
      durationDays: 180,
    });
    setRechargeDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SIM Card Management</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add SIM Card
        </Button>
      </div>

      {sims.some((s) => s.isExpired || s.isExpiringSoon) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {sims.filter((s) => s.isExpired).length} expired,{' '}
                {sims.filter((s) => s.isExpiringSoon && !s.isExpired).length} expiring soon
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total SIMs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sims.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Airtel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sims.filter((s) => s.provider === 'airtel').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sims.filter((s) => s.provider === 'jio').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {sims.filter((s) => s.isExpiringSoon).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SIM Cards</CardTitle>
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
                  <TableHead>SIM Number</TableHead>
                  <TableHead>Modem</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Recharge Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sims.map((sim) => (
                  <TableRow
                    key={sim.id}
                    className={sim.isExpired ? 'bg-red-50' : sim.isExpiringSoon ? 'bg-orange-50' : ''}
                  >
                    <TableCell className="font-medium">{sim.simNumber}</TableCell>
                    <TableCell>{sim.modemNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={sim.provider === 'airtel' ? 'info' : 'success'}>
                        {sim.provider.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sim.rechargeDate ? formatDate(sim.rechargeDate) : '-'}
                    </TableCell>
                    <TableCell>
                      {sim.expiryDate ? formatDate(sim.expiryDate) : '-'}
                    </TableCell>
                    <TableCell>
                      {sim.isExpired ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : sim.isExpiringSoon ? (
                        <Badge variant="warning">Expiring Soon</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openRechargeDialog(sim)}>
                        Recharge
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteSim(sim)} className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handlePermanentDelete(sim)} className="text-orange-600" title="Force delete - allows re-adding same number">
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

      {/* Add SIM Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add SIM Card</DialogTitle>
            <DialogDescription>Enter the details for the new SIM card.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>SIM Number</Label>
              <Input
                value={formData.simNumber}
                onChange={(e) => setFormData({ ...formData, simNumber: e.target.value })}
                placeholder="Enter SIM number"
              />
            </div>
            <div className="space-y-2">
              <Label>Modem Number (Optional)</Label>
              <Input
                value={formData.modemNumber}
                onChange={(e) => setFormData({ ...formData, modemNumber: e.target.value })}
                placeholder="e.g., MODEM 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={formData.provider}
                onValueChange={(v) => setFormData({ ...formData, provider: v as 'airtel' | 'jio' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airtel">Airtel</SelectItem>
                  <SelectItem value="jio">Jio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSim}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recharge Dialog */}
      <Dialog open={rechargeDialogOpen} onOpenChange={setRechargeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recharge SIM</DialogTitle>
            <DialogDescription>Recharge {selectedSim?.simNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recharge Date</Label>
              <Input
                type="date"
                value={rechargeData.rechargeDate}
                onChange={(e) => setRechargeData({ ...rechargeData, rechargeDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (days)</Label>
              <Select
                value={String(rechargeData.durationDays)}
                onValueChange={(v) => setRechargeData({ ...rechargeData, durationDays: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">365 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRechargeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecharge}>Recharge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
