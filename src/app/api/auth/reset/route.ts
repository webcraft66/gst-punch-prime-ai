import { z } from 'zod';
import { handle } from '@/lib/api';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { passwordPolicy } from '@/lib/permissions';
import { useToken } from '@/lib/mail';

export const POST = handle(async (req: Request) => {
  const b = z.object({ token: z.string(), password: z.string() }).parse(await req.json());
  const bad = passwordPolicy(b.password); if (bad) throw new AppError(bad);
  const db = await getDb();
  const uid = await useToken(db, b.token, 'reset');
  if (!uid) throw new AppError('This reset link is invalid or has expired. Please request a new one.', 400);
  const u = await db.one<any>(`UPDATE users SET pass_hash=$2, fails=0, locked_until=NULL, email_verified=true WHERE id=$1 RETURNING id, username, role`, [uid, await hashPassword(b.password)]);
  await audit(db, u, 'PASSWORD_RESET', 'Password reset via email link', null);
  return { ok: true };
});
