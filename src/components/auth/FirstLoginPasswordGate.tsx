import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import profileApi from '@/api/profileApi';
import { toast } from 'sonner';

/**
 * Blocking dialog that appears when the logged-in user has the
 * `must_change_password` flag set. It calls the existing
 * `PUT /api/v1/profile/password` endpoint (JWT-authed) to rotate the
 * password, then clears the flag locally.
 *
 * Rendered once at the app shell so it can overlay any route.
 */
const FirstLoginPasswordGate: React.FC = () => {
  const { user, isLoggedIn, clearMustChangePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const open = Boolean(isLoggedIn && user?.must_change_password);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (next !== confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await profileApi.changePassword({ current_password: current, new_password: next });
      clearMustChangePassword();
      toast.success('Password updated — welcome!');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: string } })?.response?.data ||
        'Failed to update password';
      toast.error(typeof message === 'string' ? message : 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Set a new password to continue</DialogTitle>
          <DialogDescription>
            For your security, please change the temporary password you were given.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fl-current">Current password</Label>
            <Input
              id="fl-current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fl-next">New password</Label>
            <Input
              id="fl-next"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500">Must be at least 8 characters.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fl-confirm">Confirm new password</Label>
            <Input
              id="fl-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FirstLoginPasswordGate;
