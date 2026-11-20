import { randomBytes } from 'node:crypto';
import { handle } from '@/lib/api';
import { requireCompany } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { audit } from '@/lib/audit';
import { appUrl } from '@/lib/mail';

/** Creates (or returns) the private share link for a voucher: anyone with the link can view and print it, nothing else. */
export const POST = handle(async (_r: Request, { params }: { params: { id: string } }) => {
  const s = await requireCompany('view');
  const db = await getDb();
  const v = await db.one<any>('SELECT id, number, share_token FROM vouchers WHERE id=$1 AND company_id=$2', [params.id, s.companyId]);
  if (!v) throw new AppError('Voucher not found.', 404);
  let token = v.share_token as string | null;
  if (!token) {
    token = randomBytes(24).toString('hex');
    await db.query('UPDATE vouchers SET share_token=$2 WHERE id=$1', [v.id, token]);
    await audit(db, s.user, 'VOUCHER_SHARE', `Share link created for ${v.number}`, s.companyId);
  }
  return { url: `${appUrl()}/i/${token}`, number: v.number };
});
