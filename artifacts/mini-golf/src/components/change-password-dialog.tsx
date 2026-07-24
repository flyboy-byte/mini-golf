import { useState } from 'react';
import { useChangePassword } from '@workspace/api-client-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const changePassword = useChangePassword();

  const reset = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const handleSubmit = async () => {
    setError(null);

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await changePassword.mutateAsync({ data: { newPassword } });
      setSuccess(true);
    } catch {
      setError('Failed to change password. Try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Change password
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Password changed. You'll be asked to sign in again next time you make a request.
            </p>
            <button
              onClick={() => handleOpenChange(false)}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl font-bold focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl font-bold focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={changePassword.isPending}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50"
            >
              {changePassword.isPending ? 'Saving...' : 'Save password'}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
