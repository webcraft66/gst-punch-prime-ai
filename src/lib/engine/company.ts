import type { Queryable } from '../db';
import { SYSTEM_LEDGERS } from './chart';
import { stateCode as codeOf, stateName } from '../gst';
import { AppError } from '../errors';

export interface CompanyIn {
  name: string; ownerName?: string; address?: string; pincode?: string; state: string; gstin?: string; pan?: string; phone?: string; email?: string;
  fyStart: string; tenantId?: string | null; bankName?: string; bankAccount?: string; bankIfsc?: string; upi?: string;
}
export interface Company {
  id: string; name: string; owner_name: string; address: string; pincode: string; state: string; state_code: string; gstin: string; pan: string;
  phone: string; email: string; fy_start: string; bank_name: string; bank_account: string; bank_ifsc: string; upi: string;
  allow_negative_stock: boolean; logo: string;
}

export async function createCompany(q: Queryable, c: CompanyIn): Promise<string> {
  const code = codeOf(c.state);
  if (!code) throw new AppError('Please choose a valid state.');
  const row = await q.one<{ id: string }>(
    `INSERT INTO companies (name,address,pincode,state,state_code,gstin,pan,phone,email,fy_start,bank_name,bank_account,bank_ifsc,upi,owner_name,tenant_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
    [c.name.trim(), c.address ?? '', c.pincode ?? '', stateName(code), code, (c.gstin ?? '').toUpperCase(), (c.pan ?? '').toUpperCase(),
      c.phone ?? '', c.email ?? '', c.fyStart, c.bankName ?? '', c.bankAccount ?? '', c.bankIfsc ?? '', c.upi ?? '', (c.ownerName ?? '').trim(), c.tenantId ?? null]
  );
  const id = row!.id;
  for (const l of SYSTEM_LEDGERS) {
    await q.query(`INSERT INTO ledgers (company_id,name,group_key,system_key) VALUES ($1,$2,$3,$4)`, [id, l.name, l.group, l.key]);
  }
  if (c.bankName?.trim()) {
    await q.query(`INSERT INTO ledgers (company_id,name,group_key) VALUES ($1,$2,'bank')`, [id, `${c.bankName.trim()} A/c`]);
  }
  return id;
}

export const getCompany = (q: Queryable, id: string) => q.one<Company>('SELECT * FROM companies WHERE id = $1', [id]);
export const listCompanies = (q: Queryable, tenantId: string | null) => q.query<Company>('SELECT * FROM companies WHERE tenant_id IS NOT DISTINCT FROM $1 ORDER BY created_at', [tenantId]);

export async function systemLedgerIds(q: Queryable, companyId: string): Promise<Record<string, string>> {
  const rows = await q.query<{ system_key: string; id: string }>('SELECT system_key, id FROM ledgers WHERE company_id=$1 AND system_key IS NOT NULL', [companyId]);
  return Object.fromEntries(rows.map((r) => [r.system_key, r.id]));
}
