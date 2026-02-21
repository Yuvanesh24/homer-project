import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

const patientSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  name: z.string().optional(),
  gender: z.string().optional(),
  age: z.number().min(18).max(100),
  affectedHand: z.enum(['left', 'right']),
  groupType: z.enum(['intervention', 'control']),
  vcgAssignment: z.enum(['VCG2', 'VCG3', 'VCG4_5']).optional(),
  studyStartDate: z.string(),
  enrollmentDate: z.string(),
  phoneNumber: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export function PatientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      patientId: '',
      name: '',
      gender: '',
      age: 18,
      affectedHand: 'right',
      groupType: 'intervention',
      studyStartDate: new Date().toISOString().split('T')[0],
      enrollmentDate: new Date().toISOString().split('T')[0],
    },
  });

  const groupType = watch('groupType');

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/patients/${id}`, data);
      } else {
        await api.post('/patients', data);
      }
      navigate('/patients');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/patients')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Patients
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Patient' : 'Add New Patient'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID *</Label>
              <Input
                id="patientId"
                placeholder="e.g., HOMER-001"
                {...register('patientId')}
              />
              {errors.patientId && (
                <p className="text-sm text-red-500">{errors.patientId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Patient Name</Label>
                <Input
                  id="name"
                  placeholder="Enter patient name"
                  {...register('name')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={watch('gender') || ''}
                  onValueChange={(value) => setValue('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  {...register('age', { valueAsNumber: true })}
                />
                {errors.age && (
                  <p className="text-sm text-red-500">{errors.age.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="affectedHand">Affected Hand</Label>
                <Select
                  value={watch('affectedHand')}
                  onValueChange={(value) => setValue('affectedHand', value as 'left' | 'right')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="groupType">Group Assignment</Label>
                <Select
                  value={watch('groupType')}
                  onValueChange={(value) => {
                    setValue('groupType', value as 'intervention' | 'control');
                    if (value === 'control') {
                      setValue('vcgAssignment', 'VCG2');
                    } else {
                      setValue('vcgAssignment', undefined);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intervention">Intervention</SelectItem>
                    <SelectItem value="control">Control</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {groupType === 'control' && (
                <div className="space-y-2">
                  <Label htmlFor="vcgAssignment">VCG Assignment</Label>
                  <Select
                    value={watch('vcgAssignment')}
                    onValueChange={(value) => setValue('vcgAssignment', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select VCG" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VCG2">VCG 2</SelectItem>
                      <SelectItem value="VCG3">VCG 3</SelectItem>
                      <SelectItem value="VCG4_5">VCG 4 & 5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studyStartDate">Study Start Date</Label>
                <Input
                  id="studyStartDate"
                  type="date"
                  {...register('studyStartDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enrollmentDate">Enrollment Date</Label>
                <Input
                  id="enrollmentDate"
                  type="date"
                  {...register('enrollmentDate')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter phone number"
                {...register('phoneNumber')}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/patients')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : isEditing ? 'Update Patient' : 'Create Patient'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
