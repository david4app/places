import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { resetPassword } from '../api/client';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      navigate('/login');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Reset your password</h1>
        <p className="mt-2 text-gray-600">Choose a new password for your account.</p>

        {!token ? (
          <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">This reset link is missing a token.</p>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-700">
              New password
              <Input
                className="mt-2 rounded-lg"
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Reset password'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link className="font-semibold text-primary hover:underline" to="/login">
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}
