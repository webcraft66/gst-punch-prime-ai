import { Brand } from '@/components/Logo';
import ResetForm from './ResetForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reset password' };
export default function Reset({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 flex justify-center"><Brand light={false} /></div>
        <h1 className="text-xl font-semibold text-slate-900">Choose a new password</h1>
        <ResetForm token={searchParams.token ?? ''} />
      </div>
    </div>
  );
}
