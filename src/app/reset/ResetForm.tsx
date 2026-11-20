'use client';
import { useState } from 'react';

export default function ResetForm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [ok, setOk] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr('');
    const f = new FormData(e.currentTarget);
    if (f.get('password') !== f.get('again')) return setErr('The two passwords do not match.');
    setBusy(true);
    const r = await fetch('/api/auth/reset', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, password: f.get('password') }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || 'Could not reset password.');
    setOk(true);
  }
  if (ok) return (<div className="mt-6 space-y-4 text-sm"><div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-emerald-800">Your password has been changed.</div><a href="/login" className="btn-primary w-full py-2.5">Sign in</a></div>);
  if (!token) return <p className="mt-4 text-sm text-red-600">This link is incomplete. Please use the link from your email, or <a className="underline" href="/forgot">request a new one</a>.</p>;
  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div><label className="label" htmlFor="p">New password</label><input id="p" name="password" type="password" className="input" required autoComplete="new-password" autoFocus /><p className="mt-1 text-[11px] text-slate-500">8+ characters, with a capital letter and a number.</p></div>
      <div><label className="label" htmlFor="a">Repeat password</label><input id="a" name="again" type="password" className="input" required autoComplete="new-password" /></div>
      {err && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err} {err.includes('expired') && <a className="underline" href="/forgot">Request a new link</a>}</div>}
      <button className="btn-primary w-full py-2.5" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
    </form>);
}
