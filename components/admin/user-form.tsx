'use client';

import { useState, useEffect } from 'react';
import { User, UserRole } from '@/lib/db/schema/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { adminUpdateUser } from '@/lib/users/actions';
import { toast } from 'sonner';

interface UserFormProps {
  userToEdit?: User;
  onClose: () => void;
}

const userRoles: { id: UserRole; name: string }[] = [
  { id: 'user', name: 'User' },
  { id: 'admin', name: 'Admin' },
];

export function UserForm({ userToEdit, onClose }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setUsername(userToEdit.username);
      setRole(userToEdit.role as UserRole);
    } else {
      setUsername('');
      setRole('user');
    }
  }, [userToEdit]);

  const validateForm = (): boolean => {
    let isValid = true;
    setUsernameError('');
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.length < 3 || username.length > 50) {
      setUsernameError('Username must be between 3 and 50 characters');
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores.');
      isValid = false;
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validateForm() || !userToEdit) {
      if (!userToEdit) toast.error("No user selected for editing.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload: { username?: string; role?: UserRole } = {};
      if (username !== userToEdit.username) {
        payload.username = username;
      }
      if (role !== userToEdit.role) {
        payload.role = role;
      }

      if (Object.keys(payload).length === 0) {
        toast.info("No changes detected.");
        onClose();
        setIsSubmitting(false); // Ensure isSubmitting is reset
        return;
      }

      await adminUpdateUser(userToEdit.id, payload);
      toast.success(`User "${username}" updated successfully`);
      onClose();
    } catch (error) {
      toast.error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle>Edit User</SheetTitle>
          <SheetDescription>
            <p>Update the user&rsquo;s username and role.</p>
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2 px-4">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              data-testid="username-input"
            />
            {usernameError && (
              <p className="text-sm text-destructive" data-testid="username-error">{usernameError}</p>
            )}
          </div>

          <div className="space-y-2 px-4">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value: string) => setRole(value as UserRole)}
              data-testid="role-select"
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select user role" />
              </SelectTrigger>
              <SelectContent>
                {userRoles.map((userRole) => (
                  <SelectItem key={userRole.id} value={userRole.id} data-testid={`role-option-${userRole.id}`}>
                    {userRole.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 px-4">
            <Label htmlFor="email">Email (Read-only)</Label>
            <Input
              id="email"
              type="email"
              value={userToEdit?.email || ''}
              readOnly
              disabled
              className="bg-muted/50"
            />
             <p className="text-xs text-muted-foreground">Email addresses cannot be changed here.</p>
          </div>

          <div className="space-y-2 px-4">
            <Label htmlFor="userId">User ID (Read-only)</Label>
            <Input
              id="userId"
              type="text"
              value={userToEdit?.id ? String(userToEdit.id) : ''}
              readOnly
              disabled
              className="bg-muted/50"
            />
          </div>

          <SheetFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              data-testid="cancel-button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !userToEdit} data-testid="submit-button">
              {isSubmitting ? 'Updating...' : 'Update User'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
