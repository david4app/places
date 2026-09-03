import { useEffect, useState, type FormEvent } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

type EditProfileDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function EditProfileDialog({ open, onClose }: EditProfileDialogProps) {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && user) {
      setName(user.name);
      setSurname(user.surname ?? '');
      setPhone(user.phone ?? '');
      setError('');
    }
  }, [open, user]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await updateProfile({ name, surname, phone });
      showToast('Profile updated.');
      onClose();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Edit profile</h2>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Email
            <Input className="mt-2 rounded-lg bg-gray-50 text-gray-500" value={user?.email ?? ''} disabled readOnly />
            <span className="mt-1 block text-xs text-gray-400">Email address can't be changed.</span>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Name
            <Input className="mt-2 rounded-lg" required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Surname
            <Input className="mt-2 rounded-lg" value={surname} onChange={(event) => setSurname(event.target.value)} placeholder="Optional" />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Phone
            <Input
              className="mt-2 rounded-lg"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Optional"
            />
          </label>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" className="px-4 py-2 text-sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="px-4 py-2 text-sm" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
