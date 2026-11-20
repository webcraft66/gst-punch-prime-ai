/**
 * Email sending + one-time tokens (verify email / reset password).
 *  - If RESEND_API_KEY is set, mail goes through Resend (https://resend.com — free tier is enough to start).
 *  - Otherwise nothing is sent; the link is printed in the server log and (local mode only) shown on screen.
 */
import { createHash, randomBytes } from 'node:crypto';
import { headers } from 'next/headers';
import type { Queryable } from './db';

export const mailConfigured = () => !!process.env.RESEND_API_KEY;
/** Local mode = no hosted database: safe to show links on screen because only the owner uses the machine. */
export const localMode = () => !process.env.DATABASE_URL;

export function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  try {
    const h = headers();
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
    const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
  } catch { return 'http://localhost:3000'; }
}

export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  if (!mailConfigured()) { console.log(`[mail not configured] To: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, ' ')}`); return false; }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: process.env.MAIL_FROM || 'Punch Prime <onboarding@resend.dev>', to: [to], subject, html }),
    });
    if (!r.ok) console.error('[mail] provider error', r.status, await r.text().catch(() => ''));
    return r.ok;
  } catch (e) { console.error('[mail] failed', e); return false; }
}

const sha = (t: string) => createHash('sha256').update(t).digest('hex');

export async function makeToken(q: Queryable, userId: string, kind: 'verify' | 'reset', hours: number): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await q.query(`INSERT INTO email_tokens (user_id, kind, token_hash, expires_at) VALUES ($1,$2,$3, now() + ($4 || ' hours')::interval)`, [userId, kind, sha(token), String(hours)]);
  return token;
}
/** Returns the user id if the token is valid and unused, and (optionally) marks it used. */
export async function useToken(q: Queryable, token: string, kind: 'verify' | 'reset', consume = true): Promise<string | null> {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const row = await q.one<any>(`SELECT id, user_id FROM email_tokens WHERE token_hash=$1 AND kind=$2 AND used_at IS NULL AND expires_at > now()`, [sha(token), kind]);
  if (!row) return null;
  if (consume) await q.query('UPDATE email_tokens SET used_at = now() WHERE id=$1', [row.id]);
  return row.user_id;
}

const wrap = (title: string, body: string, link: string, btn: string) => `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#0f172a">
<h2 style="color:#0b1f4d">${title}</h2><p>${body}</p>
<p><a href="${link}" style="background:#0b1f4d;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;display:inline-block">${btn}</a></p>
<p style="font-size:12px;color:#64748b">Or open this link: ${link}<br>If you did not ask for this, you can ignore this email.</p><p style="font-size:12px;color:#94a3b8">Punch Prime</p></div>`;

/** Creates a verification mail for the user. Returns the link (so local mode can show it) and whether mail was really sent. */
export async function sendVerify(q: Queryable, user: { id: string; name: string; email: string }): Promise<{ link: string; sent: boolean }> {
  const link = `${appUrl()}/verify?token=${await makeToken(q, user.id, 'verify', 48)}`;
  const sent = await sendMail(user.email, 'Verify your email — Punch Prime', wrap('Verify your email', `Hi ${user.name}, please confirm this email address for your Punch Prime account.`, link, 'Verify email'));
  return { link, sent };
}
export async function sendReset(q: Queryable, user: { id: string; name: string; email: string }): Promise<{ link: string; sent: boolean }> {
  const link = `${appUrl()}/reset?token=${await makeToken(q, user.id, 'reset', 1)}`;
  const sent = await sendMail(user.email, 'Reset your password — Punch Prime', wrap('Reset your password', `Hi ${user.name}, click the button to choose a new password. This link works for 1 hour.`, link, 'Reset password'));
  return { link, sent };
}
