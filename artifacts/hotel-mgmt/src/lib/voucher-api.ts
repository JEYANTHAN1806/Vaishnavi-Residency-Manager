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

export interface VoucherInput {
  type: "payment" | "receipt";
  name: string;
  reason: string;
  amount: number;
  amountInWords?: string;
  date?: string;
  approvedBy?: string;
  receivedBy?: string;
  remarks?: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchVouchers(): Promise<Voucher[]> {
  return request<Voucher[]>("/api/vouchers");
}

export async function fetchVoucherById(id: number): Promise<Voucher | null> {
  try {
    return await request<Voucher>(`/api/vouchers/${id}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) return null;
    throw err;
  }
}

export async function fetchNextVoucherNumber(type: string): Promise<string> {
  const data = await request<{ voucherNumber: string }>(
    `/api/vouchers/next-voucher-number?type=${encodeURIComponent(type)}`
  );
  return data.voucherNumber;
}

export async function createVoucher(input: VoucherInput): Promise<Voucher> {
  return request<Voucher>("/api/vouchers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateVoucher(id: number, input: Partial<VoucherInput>): Promise<Voucher> {
  return request<Voucher>(`/api/vouchers/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteVoucher(id: number): Promise<void> {
  await request<void>(`/api/vouchers/${id}`, {
    method: "DELETE",
  });
}
