import { cookies } from 'next/headers';
import { z } from 'zod';
import { handle } from '@/lib/api';
import { hashPassword, setSessionCookie, signSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { audit } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { passwordPolicy } from '@/lib/permissions';
import { createCompany } from '@/lib/engine/company';
import { validateGstin } from '@/lib/gst';
import { seedDemo } from '@/lib/demo';
import { localMode, sendVerify } from '@/lib/mail';

export const maxDuration = 60;
const schema = z.object({
  name: z.string().min(2).max(80), username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9._-]+$/, 'letters, numbers, . _ - only'),
  password: z.string(), email: z.string().trim().toLowerCase().email('Enter a valid email address').max(100),
  mode: z.enum(['demo', 'company']),
  company: z.object({ name: z.string().max(100), state: z.string(), gstin: z.string().optional().default(''), fyStart: z.string() }).optional(),
});

/** Self sign-up: creates a brand-new account (its own Owner, own company/demo data, isolated from every other account). */
export const POST = handle(async (req: Request) => {
  const b = schema.parse(await req.json());
  const db = await getDb();
  const bad = passwordPolicy(b.password); if (bad) throw new AppError(bad);
  if (b.mode === 'company') {
    if (!b.company?.name.trim()) throw new AppError('Enter your company name.');
    if (b.company.gstin) { const g = validateGstin(b.company.gstin); if (!g.ok) throw new AppError(`GSTIN: ${g.message}`); }
  }
  const hash = await hashPassword(b.password);
  const user = await db.tx(async (q) => {
    if (await q.one("SELECT 1 FROM users WHERE lower(email)=$1", [b.email])) throw new AppError('An account with this email already exists. Try signing in or use Forgot password.', 409);
    if (await q.one('SELECT 1 FROM users WHERE username=$1', [b.username.toLowerCase()])) throw new AppError('That username is already taken. Please choose another one.', 409);
    const u = (await q.one<any>(`INSERT INTO users (username,name,email,role,pass_hash,created_by) VALUES ($1,$2,$3,1,$4,'signup') RETURNING id, username`, [b.username.toLowerCase(), b.name.trim(), b.email, hash]))!;
    await q.query('UPDATE users SET tenant_id = id WHERE id = $1', [u.id]); // this user's account = its own tenant
    return u;
  });
  const actor = { id: user.id, username: user.username, role: 1 };
  if (b.mode === 'demo') await seedDemo(db, actor, b.name.trim(), user.id);
  else {
    const c = b.company!;
    await db.tx((q) => createCompany(q, { name: c.name, ownerName: b.name.trim(), tenantId: user.id, state: c.state, gstin: c.gstin, pan: c.gstin ? c.gstin.slice(2, 12) : '', fyStart: c.fyStart }));
  }
  await audit(db, actor, 'SETUP', `New account created (${b.mode})`, null);
  const ver = await sendVerify(db, { id: user.id, name: b.name.trim(), email: b.email }).catch(() => null);
  setSessionCookie(cookies(), await signSession(user.id));
  return { ok: true, verifyLink: ver && !ver.sent && localMode() ? ver.link : undefined };
});
