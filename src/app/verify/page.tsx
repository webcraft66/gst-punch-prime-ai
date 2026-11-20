import Link from 'next/link';
import { getDb } from '@/lib/db';
import { useToken } from '@/lib/mail';
import { Brand } from '@/components/Logo';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Verify email' };

export default async function VerifyPage({ searchParams }: { searchParams: { token?: string } }) {
  const db = await getDb();
  const uid = searchParams.token ? await useToken(db, searchParams.token, 'verify') : null;
  if (uid) await db.query('UPDATE users SET email_verified=true WHERE id=$1', [uid]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="mb-6 flex justify-center"><Brand light={false} /></div>
        <h1 className="text-xl font-semibold text-slate-900">{uid ? 'Email verified ✓' : 'Link not valid'}</h1>
        <p className="mt-2 text-sm text-slate-500">{uid ? 'Thank you. Your email address is now confirmed.' : 'This verification link is invalid or has expired. Sign in and request a new one.'}</p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Continue</Link>
      </div>
    </div>
  );
}
