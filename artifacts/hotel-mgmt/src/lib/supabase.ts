const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const headers: Record<string, string> = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

export interface VoucherRow {
  id: number;
  voucher_number: string;
  type: string;
  name: string;
  reason: string;
  amount: string;
  amount_in_words: string | null;
  date: string;
  approved_by: string | null;
  received_by: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface Voucher {
  id: number;
  voucherNumber: string;
  type: "payment" | "receipt";
  name: string;
  reason: string;
  amount: number;
  amountInWords: string | null;
  date: string;
  approvedBy: string | null;
  receivedBy: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(r: VoucherRow): Voucher {
  return {
    id: r.id,
    voucherNumber: r.voucher_number,
    type: r.type as "payment" | "receipt",
    name: r.name,
    reason: r.reason,
    amount: parseFloat(r.amount),
    amountInWords: r.amount_in_words,
    date: r.date,
    approvedBy: r.approved_by,
    receivedBy: r.received_by,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function fetchVouchers(): Promise<Voucher[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/vouchers?order=created_at.desc`, {
    headers: { ...headers, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to fetch vouchers: ${res.status}`);
  const rows = (await res.json()) as VoucherRow[];
  return rows.map(mapRow);
}

export async function fetchVoucherById(id: number): Promise<Voucher | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/vouchers?id=eq.${id}&limit=1`,
    { headers: { ...headers, Accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`Failed to fetch voucher: ${res.status}`);
  const rows = (await res.json()) as VoucherRow[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function fetchNextVoucherNumber(type: string): Promise<string> {
  const prefix = type === "receipt" ? "RV" : "PV";
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/vouchers?type=eq.${type}&order=voucher_number.desc&limit=1&select=voucher_number`,
    { headers: { ...headers, Accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`Failed to fetch next voucher number: ${res.status}`);
  const rows = (await res.json()) as { voucher_number: string }[];
  if (!rows[0]) return `${prefix}-000001`;
  const last = rows[0].voucher_number;
  const match = last.match(/-(\d+)/);
  if (!match) return `${prefix}-000001`;
  const next = parseInt(match[1]) + 1;
  return `${prefix}-${String(next).padStart(6, "0")}`;
}

export interface VoucherInput {
  type: "payment" | "receipt";
  name: string;
  reason: string;
  amount: number;
  amountInWords?: string;
  date: string;
  approvedBy?: string;
  receivedBy?: string;
  remarks?: string;
}

export async function createVoucher(input: VoucherInput): Promise<Voucher> {
  const body = {
    type: input.type,
    name: input.name,
    reason: input.reason,
    amount: String(input.amount),
    amount_in_words: input.amountInWords || null,
    date: input.date,
    approved_by: input.approvedBy || null,
    received_by: input.receivedBy || null,
    remarks: input.remarks || null,
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create voucher: ${res.status} ${text}`);
  }
  const rows = (await res.json()) as VoucherRow[];
  return mapRow(rows[0]);
}

export async function updateVoucher(id: number, input: Partial<VoucherInput>): Promise<Voucher> {
  const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.type !== undefined) body.type = input.type;
  if (input.name !== undefined) body.name = input.name;
  if (input.reason !== undefined) body.reason = input.reason;
  if (input.amount !== undefined) body.amount = String(input.amount);
  if (input.amountInWords !== undefined) body.amount_in_words = input.amountInWords;
  if (input.date !== undefined) body.date = input.date;
  if (input.approvedBy !== undefined) body.approved_by = input.approvedBy;
  if (input.receivedBy !== undefined) body.received_by = input.receivedBy;
  if (input.remarks !== undefined) body.remarks = input.remarks;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/vouchers?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update voucher: ${res.status} ${text}`);
  }
  const rows = (await res.json()) as VoucherRow[];
  return mapRow(rows[0]);
}

export async function deleteVoucher(id: number): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/vouchers?id=eq.${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(`Failed to delete voucher: ${res.status}`);
}
