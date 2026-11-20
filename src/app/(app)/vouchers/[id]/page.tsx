import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { VOUCHER_LABEL, type VoucherType } from '@/lib/engine/chart';
import { getVoucher } from '@/lib/engine/vouchers';
import InvoiceSheet from '@/components/InvoiceSheet';
import { amountInWords, fmtDate, fmtMoney, fmtQty } from '@/lib/money';
import { needCompany } from '@/lib/page';
import { can } from '@/lib/permissions';
import VoucherActions from './VoucherActions';

export const metadata = { title: 'Voucher' };
export default async function VoucherView({ params, searchParams }: { params: { id: string }; searchParams: { saved?: string } }) {
  const { db, company, role } = await needCompany();
  const v = await getVoucher(db, company.id, params.id);
  if (!v) notFound();
  const type = v.type as VoucherType;
  const isItem = ['sales', 'purchase', 'credit_note', 'debit_note'].includes(type);
  return (
    <div>
      <PageHeader title={v.number} subtitle={`${VOUCHER_LABEL[type]} · ${fmtDate(v.date)}`}
        actions={<VoucherActions id={v.id} canEdit={can(role, 'voucher.edit')} canDelete={can(role, 'voucher.delete')} />} />
      {searchParams.saved && <div className="no-print mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Icon name="check" size={16} />Saved successfully. Accounting and stock have been updated.</div>}

      <InvoiceSheet v={v} company={company} />

      {isItem && (
        <details className="no-print mx-auto mt-4 max-w-4xl"><summary className="cursor-pointer text-sm font-medium text-brand-700">Accounting impact (ledger postings)</summary>
          <div className="card mt-2 overflow-hidden"><table className="w-full"><thead><tr><th className="th">Ledger</th><th className="th text-right">Debit</th><th className="th text-right">Credit</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{v.entries.map((e: any, i: number) => <tr key={i}><td className="td">{e.ledger}</td><td className="td num">{e.debit ? fmtMoney(e.debit) : ''}</td><td className="td num">{e.credit ? fmtMoney(e.credit) : ''}</td></tr>)}</tbody></table></div></details>)}
      <div className="no-print mx-auto mt-4 max-w-4xl"><Link href="/vouchers" className="text-sm text-brand-700 hover:underline">← Back to vouchers</Link></div>
    </div>
  );
}
