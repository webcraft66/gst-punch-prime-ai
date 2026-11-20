import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Brand } from '@/components/Logo';
import ForgotForm from './ForgotForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Forgot password' };
export default async function Forgot() {
  if (await getSession()) redirect('/dashboard');
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 flex justify-center"><Brand light={false} /></div>
        <h1 className="text-xl font-semibold text-slate-900">Forgot your password?</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your username or the email on your account. We will email you a link to set a new password.</p>
        <ForgotForm />
      </div>
    </div>
  );
}
