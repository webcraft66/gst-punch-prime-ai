import { notFound } from 'next/navigation';
import InvoiceSheet from '@/components/InvoiceSheet';
import { getDb } from '@/lib/db';
import { getVoucher } from '@/lib/engine/vouchers';
import { getCompany } from '@/lib/engine/company';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Invoice', robots: { index: false, follow: false } };

/** Public, read-only invoice reachable only through its unguessable link. */
export default async function SharedInvoice({ params }: { params: { token: string } }) {
  if (!/^[0-9a-f]{48}$/.test(params.token)) notFound();
  const db = await getDb();
  const row = await db.one<any>('SELECT id, company_id FROM vouchers WHERE share_token=$1', [params.token]);
  if (!row) notFound();
  const [v, company] = await Promise.all([getVoucher(db, row.company_id, row.id), getCompany(db, row.company_id)]);
  if (!v || !company) notFound();
  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6">
      <div className="no-print mx-auto mb-4 flex max-w-4xl items-center justify-between">
        <div className="text-sm text-slate-600">Invoice from <b>{company.name}</b></div>
        <PrintButton label="Download / Print PDF" />
      </div>
      <InvoiceSheet v={v} company={company} showCreator={false} />
      <p className="no-print mt-6 text-center text-xs text-slate-400">Powered by Punch Prime</p>
    </div>
  );
}
