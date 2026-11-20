'use client';
import { useState } from 'react';

export default function VerifyBanner({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle'); const [dev, setDev] = useState(''); const [hide, setHide] = useState(false);
  if (hide) return null;
  async function send() {
    setState('busy');
    const r = await fetch('/api/auth/verify', { method: 'POST' }); const j = await r.json().catch(() => ({}));
    setDev(j.devLink || ''); setState('sent');
  }
  return (
    <div className="no-print mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
      <span>Please verify your email <b>{email}</b> — you will need it to recover your password.</span>
      {state === 'sent' ? <span className="font-medium">{dev ? <>Email is not set up here — <a className="underline" href={dev}>click to verify now</a></> : 'Verification email sent. Check your inbox.'}</span>
        : <button className="font-semibold underline" onClick={send} disabled={state === 'busy'}>{state === 'busy' ? 'Sending…' : 'Send verification email'}</button>}
      <button className="ml-auto text-amber-700" aria-label="Dismiss" onClick={() => setHide(true)}>✕</button>
    </div>);
}
