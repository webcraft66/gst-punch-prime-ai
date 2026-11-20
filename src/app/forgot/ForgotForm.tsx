'use client';
import { useState } from 'react';

export default function ForgotForm() {
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [err, setErr] = useState(''); const [dev, setDev] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr('');
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/auth/forgot', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ who: f.get('who') }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || 'Something went wrong.');
    setDone(true); setDev(j.devLink || '');
  }
  if (done) return (
    <div className="mt-6 space-y-3 text-sm">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-emerald-800">If an account with that username or email exists, a reset link has been sent. Please check your inbox (and spam folder).</div>
      {dev && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-amber-900"><b>Local mode:</b> email is not set up, so use this link directly:<br /><a className="break-all font-medium underline" href={dev}>Reset my password</a></div>}
      <a href="/login" className="block text-center text-brand-700 hover:underline">← Back to sign in</a>
    </div>);
  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div><label className="label" htmlFor="w">Username or email</label><input id="w" name="who" className="input" required autoFocus /></div>
      {err && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      <button className="btn-primary w-full py-2.5" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
      <a href="/login" className="block text-center text-sm text-brand-700 hover:underline">← Back to sign in</a>
    </form>);
}
