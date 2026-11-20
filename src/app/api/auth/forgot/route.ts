import { z } from 'zod';
import { handle } from '@/lib/api';
import { getDb } from '@/lib/db';
import { audit } from '@/lib/audit';
import { localMode, sendReset } from '@/lib/mail';

/** Always answers the same way, so nobody can use this form to discover which usernames/emails exist. */
export const POST = handle(async (req: Request) => {
  const { who } = z.object({ who: z.string().min(2).max(100) }).parse(await req.json());
  const db = await getDb();
  const key = who.trim().toLowerCase();
  const users = await db.query<any>(`SELECT id, name, email FROM users WHERE active AND email <> '' AND (username=$1 OR lower(email)=$1) LIMIT 3`, [key]);
  let devLink: string | undefined;
  for (const u of users) {
    const recent = await db.one<any>(`SELECT COUNT(*)::int c FROM email_tokens WHERE user_id=$1 AND kind='reset' AND created_at > now() - interval '1 hour'`, [u.id]);
    if (recent && recent.c >= 3) continue; // gentle rate limit
    const r = await sendReset(db, u);
    await audit(db, { id: u.id, username: key, role: 0 }, 'PASSWORD_RESET_REQUEST', r.sent ? 'Email sent' : 'Email provider not configured', null);
    if (!r.sent && localMode()) devLink = r.link;
  }
  return { ok: true, devLink };
});
