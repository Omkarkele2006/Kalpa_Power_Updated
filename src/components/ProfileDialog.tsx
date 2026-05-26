import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Calendar, Mail, Shield } from 'lucide-react';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileFormData {
  first_name: string;
  last_name: string;
  mobile: string;
  department: string;
  designation: string;
  employee_id: string;
  full_name: string; // derived, display-only
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user, profile, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    mobile: '',
    department: '',
    designation: '',
    employee_id: '',
    full_name: '',
  });

  // Load profile data when dialog opens
  useEffect(() => {
    if (open && profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        mobile: profile.mobile || '',
        department: profile.department || '',
        designation: profile.designation || '',
        employee_id: profile.employee_id || '',
        full_name: profile.full_name || '',
      });
    }
  }, [open, profile]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    if (field === 'full_name') return; // read-only
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.first_name.trim()) {
      toast.error('First name is required');
      return false;
    }
    if (!formData.last_name.trim()) {
      toast.error('Last name is required');
      return false;
    }
    if (formData.mobile && !/^\+?[\d\s\-()]{7,}$/.test(formData.mobile)) {
      toast.error('Please enter a valid mobile number');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      const updateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        mobile: formData.mobile.trim(),
        department: formData.department.trim(),
        designation: formData.designation.trim(),
        employee_id: formData.employee_id.trim(),
        // full_name is derived on client — update it for convenience
        full_name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Refetch profile data to sync context
      await supabase.auth.refreshSession();

      toast.success('Profile updated successfully');
      onOpenChange(false);
    } catch (err: any) {
      console.error('[ProfileDialog] Save error:', err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const roleLabels: Record<string, string> = {
    'designer': 'Designer',
    'line-manager': 'Line Manager',
    'dept-head': 'Dept Head',
    'site-engineer': 'Site Engineer',
    'vendor-client': 'Vendor / Client',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Read-only fields section */}
          <div className="space-y-3 p-3 rounded-lg bg-muted/40 border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account Information</p>

            {/* Email - read-only */}
            <div className="space-y-1">
              <Label className="text-xs">Email Address</Label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">{user?.email ?? '—'}</span>
              </div>
            </div>

            {/* Role - read-only */}
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                <Badge variant="outline" className="text-xs">
                  {roleLabels[role ?? 'designer'] ?? role}
                </Badge>
              </div>
            </div>

            {/* Account Created Date - read-only */}
            {profile?.created_at && (
              <div className="space-y-1">
                <Label className="text-xs">Account Created</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  {new Date(profile.created_at).toLocaleDateString('en-IN')}
                </div>
              </div>
            )}
          </div>

          {/* Editable fields section */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Personal Information</p>

            {/* Full Name (derived) */}
            <div className="space-y-1">
              <Label htmlFor="fullName" className="text-xs">Full Name</Label>
              <Input
                id="fullName"
                value={`${formData.first_name} ${formData.last_name}`.trim()}
                disabled
                className="bg-muted text-xs"
                placeholder="Auto-derived from first and last name"
              />
              <p className="text-[10px] text-muted-foreground">Auto-derived from first and last name</p>
            </div>

            {/* First Name */}
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-xs">First Name <span className="text-destructive">*</span></Label>
              <Input
                id="firstName"
                value={formData.first_name}
                onChange={e => handleInputChange('first_name', e.target.value)}
                placeholder="e.g., Amit"
                maxLength={100}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-xs">Last Name <span className="text-destructive">*</span></Label>
              <Input
                id="lastName"
                value={formData.last_name}
                onChange={e => handleInputChange('last_name', e.target.value)}
                placeholder="e.g., Deshmukh"
                maxLength={100}
              />
            </div>

            {/* Mobile */}
            <div className="space-y-1">
              <Label htmlFor="mobile" className="text-xs">Mobile Number</Label>
              <Input
                id="mobile"
                value={formData.mobile}
                onChange={e => handleInputChange('mobile', e.target.value)}
                placeholder="+91 98765 43210"
                maxLength={20}
              />
            </div>

            {/* Department */}
            <div className="space-y-1">
              <Label htmlFor="department" className="text-xs">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={e => handleInputChange('department', e.target.value)}
                placeholder="e.g., Engineering"
                maxLength={100}
              />
            </div>

            {/* Designation */}
            <div className="space-y-1">
              <Label htmlFor="designation" className="text-xs">Designation</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={e => handleInputChange('designation', e.target.value)}
                placeholder="e.g., Senior Solar Engineer"
                maxLength={100}
              />
            </div>

            {/* Employee ID */}
            <div className="space-y-1">
              <Label htmlFor="employeeId" className="text-xs">Employee ID</Label>
              <Input
                id="employeeId"
                value={formData.employee_id}
                onChange={e => handleInputChange('employee_id', e.target.value)}
                placeholder="e.g., KP-2026-001"
                maxLength={50}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
