import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { useAuth } from '../context/AuthContext';

export function Auth({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = (location.state as { from?: string } | null)?.from ?? '/profile';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) await register(name, email, password);
      else await login(email, password);
      navigate(destination, { replace: true });
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12"><div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"><h1 className="text-3xl font-bold text-gray-900">{isRegister ? 'Create your account' : 'Welcome back'}</h1><p className="mt-2 text-gray-600">{isRegister ? 'Join staybnb and start planning your next stay.' : 'Log in to manage your stays.'}</p><form className="mt-8 space-y-4" onSubmit={handleSubmit}>{isRegister && <label className="block text-sm font-medium text-gray-700">Full name<Input className="mt-2 rounded-lg" required value={name} onChange={(event) => setName(event.target.value)} /></label>}<label className="block text-sm font-medium text-gray-700">Email<Input className="mt-2 rounded-lg" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="block text-sm font-medium text-gray-700">Password<Input className="mt-2 rounded-lg" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{!isRegister && <p className="text-right text-sm"><Link className="font-medium text-primary hover:underline" to="/forgot-password">Forgot password?</Link></p>}{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Button className="w-full" type="submit" disabled={submitting}>{submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}</Button></form><p className="mt-6 text-center text-sm text-gray-600">{isRegister ? 'Already have an account? ' : "Don't have an account? "}<Link className="font-semibold text-primary hover:underline" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Register'}</Link></p></div></main>;
}