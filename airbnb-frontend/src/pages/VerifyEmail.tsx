import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../api/client';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing a token.');
      return;
    }
    verifyEmail(token)
      .then((result) => {
        setStatus('success');
        setMessage(result.message);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Verification failed.');
      });
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Email verification</h1>
        {status === 'pending' && <p className="mt-4 text-gray-600">Verifying…</p>}
        {status === 'success' && <p className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">{message}</p>}
        {status === 'error' && <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{message}</p>}
        <Link to="/profile" className="mt-6 inline-block font-semibold text-primary hover:underline">
          Go to your profile
        </Link>
      </div>
    </main>
  );
}
