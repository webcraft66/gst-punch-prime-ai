import { handle } from '@/lib/api';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { localMode, sendVerify } from '@/lib/mail';

/** Signed-in user asks for a (new) verification email. */
export const POST = handle(async () => {
  const s = await requireSession();
  const db = await getDb();
  const u = await db.one<any>('SELECT id, name, email, email_verified FROM users WHERE id=$1', [s.user.id]);
  if (!u?.email) throw new AppError('Add an email address to your account first.');
  if (u.email_verified) return { ok: true, already: true };
  const r = await sendVerify(db, u);
  return { ok: true, sent: r.sent, devLink: !r.sent && localMode() ? r.link : undefined };
});
