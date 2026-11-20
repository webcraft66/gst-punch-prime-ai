import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import SetupForm from './SetupForm';
import { Brand } from '@/components/Logo';
import { fyLabel, todayISO } from '@/lib/money';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Set up Punch Prime' };

export default async function SetupPage() {
  if (await getSession()) redirect('/dashboard');
  const t = todayISO(); const y = Number(t.slice(0, 4)); const fy = Number(t.slice(5, 7)) >= 4 ? y : y - 1;
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex justify-center"><Brand /></div>
        <div className="card overflow-hidden shadow-pop">
          <div className="border-b border-slate-100 bg-slate-50 px-8 py-5">
            <h1 className="text-xl font-semibold text-slate-900">Create your free account</h1>
            <p className="mt-1 text-sm text-slate-500">Takes about a minute. Your data stays private to your account.</p>
          </div>
          <><SetupForm defaultFy={`${fy}-04-01`} fyLabel={fyLabel(`${fy}-04-01`)} /><p className="border-t border-slate-100 px-8 py-4 text-center text-sm text-slate-500">Already have an account? <a href="/login" className="font-medium text-brand-700 hover:underline">Sign in</a></p></>
        </div>
      </div>
    </div>
  );
}
