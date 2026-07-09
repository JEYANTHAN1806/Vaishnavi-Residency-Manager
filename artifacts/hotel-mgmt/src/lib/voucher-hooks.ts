import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchVouchers,
  fetchVoucherById,
  fetchNextVoucherNumber,
  createVoucher as createVoucherApi,
  updateVoucher as updateVoucherApi,
  deleteVoucher as deleteVoucherApi,
  type Voucher,
  type VoucherInput,
} from "./supabase";

const queryKey = ["vouchers"] as const;

export function useGetVouchers() {
  return useQuery<Voucher[]>({
    queryKey,
    queryFn: fetchVouchers,
  });
}

export function useGetVoucher(id: number, options?: { query?: { enabled?: boolean } }) {
  return useQuery<Voucher | null>({
    queryKey: [...queryKey, id],
    queryFn: () => fetchVoucherById(id),
    enabled: options?.query?.enabled ?? true,
  });
}

export function useGetNextVoucherNumberForType(params: { type: string }) {
  return useQuery<{ voucherNumber: string }>({
    queryKey: ["voucher-next-number", params.type],
    queryFn: async () => ({ voucherNumber: await fetchNextVoucherNumber(params.type) }),
  });
}

export function useCreateVoucher() {
  const qc = useQueryClient();
  return useMutation<Voucher, Error, { data: VoucherInput }>({
    mutationFn: ({ data }) => createVoucherApi(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateVoucher() {
  const qc = useQueryClient();
  return useMutation<Voucher, Error, { id: number; data: Partial<VoucherInput> }>({
    mutationFn: ({ id, data }) => updateVoucherApi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteVoucher() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: number }>({
    mutationFn: ({ id }) => deleteVoucherApi(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
  });
}
