import QRCode from 'qrcode';
import { VOUCHER_LABEL, type VoucherType } from '@/lib/engine/chart';
import { stateName } from '@/lib/gst';
import { amountInWords, fmtDate, fmtMoney, fmtQty } from '@/lib/money';

/** The printable invoice / voucher. Used by the signed-in view and by the public share link. */
export default async function InvoiceSheet({ v, company, showCreator = true }: { v: any; company: any; showCreator?: boolean }) {
  const type = v.type as VoucherType;
  const isItem = ['sales', 'purchase', 'credit_note', 'debit_note'].includes(type);
  const label = type === 'sales' ? 'TAX INVOICE' : type === 'purchase' ? 'PURCHASE BILL' : VOUCHER_LABEL[type].toUpperCase();
  const gstSplit = v.intra_state;
  // UPI QR: scan-to-pay for sales invoices (amount + invoice number pre-filled)
  let qr = '';
  if (type === 'sales' && company.upi) {
    const link = `upi://pay?pa=${encodeURIComponent(company.upi)}&pn=${encodeURIComponent(company.name)}&am=${Number(v.total).toFixed(2)}&cu=INR&tn=${encodeURIComponent(v.number)}`;
    qr = await QRCode.toString(link, { type: 'svg', margin: 0, width: 96 });
  }
  return (
    <article className="print-sheet card mx-auto max-w-4xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-brand-950 px-8 py-6 text-white print:bg-white print:text-black">
          <div className="flex items-start gap-4">
            {company.logo && <img src={company.logo} alt="" className="h-16 w-16 shrink-0 rounded-lg bg-white object-contain p-1" />}
            <div>
            <div className="text-xl font-bold tracking-wide text-gold-400 print:text-brand-900">{company.name}</div>
            <div className="mt-1 max-w-sm text-xs leading-relaxed text-brand-200 print:text-slate-600">{company.address}{company.pincode && ` – ${company.pincode}`}<br />{company.state}{company.phone && ` · ${company.phone}`}{company.email && ` · ${company.email}`}</div>
            {company.gstin && <div className="mt-1.5 font-mono text-xs text-brand-100 print:text-slate-700">GSTIN: {company.gstin}</div>}
            </div>
          </div>
          <div className="text-right"><div className="text-lg font-semibold tracking-widest">{label}</div><div className="mt-1 font-mono text-sm text-brand-200 print:text-slate-700">{v.number}</div><div className="text-xs text-brand-200 print:text-slate-600">Date: {fmtDate(v.date)}</div></div>
        </div>

        <div className="grid gap-6 px-8 py-5 sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{isItem ? (type === 'purchase' || type === 'debit_note' ? 'Supplier' : 'Bill to') : type === 'receipt' ? 'Received from' : type === 'payment' ? 'Paid to' : 'Particulars'}</div>
            <div className="mt-1 font-semibold text-slate-900">{v.party_name || '—'}</div>
            {v.party_address && <div className="text-sm text-slate-600">{v.party_address}</div>}
            {v.party_state && <div className="text-sm text-slate-600">{v.party_state}</div>}
            {v.party_gstin && <div className="font-mono text-xs text-slate-600">GSTIN: {v.party_gstin}</div>}
          </div>
          <div className="text-sm sm:text-right">
            {isItem && <div className="text-slate-600">Place of supply: <b className="text-slate-900">{v.place_of_supply} – {stateName(v.place_of_supply)}{v.intra_state ? ' (Intra-state)' : ' (Inter-state)'}</b></div>}
            {v.ref_no && <div className="text-slate-600">Reference: <b className="text-slate-900">{v.ref_no}</b></div>}
            {v.account_name && <div className="text-slate-600">Account: <b className="text-slate-900">{v.account_name}</b></div>}
          </div>
        </div>

        {isItem ? (
          <div className="overflow-x-auto px-8"><table className="w-full border border-slate-200 text-sm">
            <thead><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">{['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc', 'Taxable', gstSplit ? 'CGST + SGST' : 'IGST', 'Amount'].map((h, i) => <th key={h} className={`px-2.5 py-2 font-semibold ${i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {v.lines.map((l: any, i: number) => (
                <tr key={l.id}><td className="px-2.5 py-2 text-slate-500">{i + 1}</td><td className="px-2.5 py-2 font-medium text-slate-900">{l.description || l.item_name}</td><td className="px-2.5 py-2 text-slate-600">{l.hsn}</td>
                  <td className="num px-2.5 py-2">{fmtQty(l.qty)} {l.unit}</td><td className="num px-2.5 py-2">{fmtMoney(l.rate)}</td><td className="num px-2.5 py-2">{Number(l.discount_pct) ? `${l.discount_pct}%` : '—'}</td>
                  <td className="num px-2.5 py-2">{fmtMoney(l.taxable)}</td><td className="num px-2.5 py-2 text-slate-600">{fmtMoney(gstSplit ? Number(l.cgst) + Number(l.sgst) : l.igst)} <span className="text-[10px] text-slate-400">@{l.gst_rate}%</span></td><td className="num px-2.5 py-2 font-medium">{fmtMoney(l.amount)}</td></tr>))}
            </tbody></table></div>
        ) : (
          <div className="px-8"><table className="w-full border border-slate-200 text-sm"><thead><tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><th className="px-3 py-2 text-left">Ledger</th><th className="px-3 py-2 text-right">Debit</th><th className="px-3 py-2 text-right">Credit</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{v.entries.map((e: any, i: number) => <tr key={i}><td className="px-3 py-2">{e.ledger}</td><td className="num px-3 py-2">{e.debit ? fmtMoney(e.debit) : ''}</td><td className="num px-3 py-2">{e.credit ? fmtMoney(e.credit) : ''}</td></tr>)}</tbody></table></div>)}

        <div className="grid gap-6 px-8 py-5 sm:grid-cols-2">
          <div className="text-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Amount in words</div>
            <div className="mt-1 italic text-slate-700">{amountInWords(v.total)}</div>
            {v.narration && <><div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Notes</div><div className="mt-1 text-slate-700">{v.narration}</div></>}
            {type === 'sales' && (company.bank_account || qr) && <div className="mt-4 flex items-center gap-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              {qr && <div className="shrink-0 text-center"><div className="h-24 w-24 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} /><div className="mt-1 text-[10px] font-medium text-slate-500">Scan to pay ₹{fmtMoney(v.total)}</div></div>}
              <div><b className="text-slate-800">Bank details</b><br />{company.bank_account && <>{company.bank_name} · A/c {company.bank_account} · IFSC {company.bank_ifsc}</>}{company.upi && <><br />UPI: {company.upi}</>}</div></div>}
          </div>
          {isItem ? (
            <dl className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Taxable value</dt><dd className="tabular-nums">{fmtMoney(v.taxable)}</dd></div>
              {Number(v.cgst) > 0 && <div className="flex justify-between"><dt className="text-slate-500">CGST</dt><dd className="tabular-nums">{fmtMoney(v.cgst)}</dd></div>}
              {Number(v.sgst) > 0 && <div className="flex justify-between"><dt className="text-slate-500">SGST</dt><dd className="tabular-nums">{fmtMoney(v.sgst)}</dd></div>}
              {Number(v.igst) > 0 && <div className="flex justify-between"><dt className="text-slate-500">IGST</dt><dd className="tabular-nums">{fmtMoney(v.igst)}</dd></div>}
              {Number(v.cess) > 0 && <div className="flex justify-between"><dt className="text-slate-500">Cess</dt><dd className="tabular-nums">{fmtMoney(v.cess)}</dd></div>}
              {Number(v.round_off) !== 0 && <div className="flex justify-between"><dt className="text-slate-500">Round off</dt><dd className="tabular-nums">{fmtMoney(v.round_off)}</dd></div>}
              <div className="flex justify-between border-t-2 border-slate-800 pt-2 text-lg font-bold text-slate-900"><dt>Total</dt><dd className="tabular-nums">₹{fmtMoney(v.total)}</dd></div>
            </dl>) : <div className="ml-auto text-right"><div className="text-xs text-slate-500">Amount</div><div className="text-2xl font-bold tabular-nums text-slate-900">₹{fmtMoney(v.total)}</div></div>}
        </div>
        <div className="flex items-end justify-between border-t border-slate-200 px-8 py-6 text-xs text-slate-500">
          <div>{showCreator ? <>Created by {v.created_by} · {fmtDate(v.created_at)}{v.updated_by && <> · Edited by {v.updated_by}</>}</> : <>Generated on {fmtDate(v.created_at)}</>}</div>
          <div className="text-center"><div className="mb-1 text-[11px] text-slate-500">For {company.name}</div><div className="mb-6" /><div className="border-t border-slate-400 px-10 pt-1">{company.owner_name ? <><b className="text-sm text-slate-800">{company.owner_name}</b><div>Owner · Authorised signatory</div></> : 'Authorised signatory'}</div></div>
        </div>
    </article>
  );
}
