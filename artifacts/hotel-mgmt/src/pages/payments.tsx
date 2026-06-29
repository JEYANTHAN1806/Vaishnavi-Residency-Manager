import { useState } from "react";
import { useGetPayments, useGetGuests, useCreatePayment } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const modeColors: Record<string, string> = {
  Cash: "bg-green-100 text-green-700",
  cash: "bg-green-100 text-green-700",
  Card: "bg-blue-100 text-blue-700",
  card: "bg-blue-100 text-blue-700",
  UPI: "bg-purple-100 text-purple-700",
  upi: "bg-purple-100 text-purple-700",
  "Bank Transfer": "bg-orange-100 text-orange-700",
  bank_transfer: "bg-orange-100 text-orange-700",
};

export default function Payments() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ guestId: "", amount: "", paymentMode: "Cash", type: "receipt", remarks: "" });
  const { data: payments, isLoading, refetch } = useGetPayments();
  const { data: guests } = useGetGuests();
  const createPayment = useCreatePayment();

  const activeGuests = guests?.filter(g => g.status === "checked-in" || g.status === "booked") || [];

  const filtered = payments?.filter(p =>
    !search || (p.guestName || "").toLowerCase().includes(search.toLowerCase()) || (p.voucherNumber || "").includes(search)
  ) || [];

  const totalToday = payments?.filter(p => {
    const today = new Date().toISOString().slice(0, 10);
    return (p.createdAt || "").slice(0, 10) === today;
  }).reduce((sum, p) => sum + parseFloat(String(p.amount || 0)), 0) || 0;

  const handleRecord = () => {
    if (!form.guestId || !form.amount) {
      toast.error("Please select a guest and enter amount");
      return;
    }
    createPayment.mutate(
      {
        data: {
          guestId: parseInt(form.guestId),
          amount: parseFloat(form.amount),
          paymentMode: form.paymentMode,
          type: form.type as "receipt" | "payment",
          remarks: form.remarks || undefined,
        },
      },
      {
        onSuccess: (data) => {
          toast.success(`Payment recorded! Voucher: ${data.voucherNumber}`);
          setOpen(false);
          setForm({ guestId: "", amount: "", paymentMode: "Cash", type: "receipt", remarks: "" });
          refetch();
        },
        onError: () => toast.error("Failed to record payment"),
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Record Payment
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Today's Collections</p>
            <p className="text-3xl font-bold text-primary">₹{totalToday.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by guest name or voucher..." className="pl-10 h-11" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No payments recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Voucher", "Guest", "Amount", "Mode", "Type", "Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(pay => (
                    <tr key={pay.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-primary">{pay.voucherNumber}</td>
                      <td className="px-4 py-3 font-medium">{pay.guestName}</td>
                      <td className="px-4 py-3 font-semibold">₹{parseFloat(String(pay.amount)).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${modeColors[pay.paymentMode] || "bg-gray-100 text-gray-600"}`}>
                          {pay.paymentMode}
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{pay.type}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {pay.createdAt ? format(new Date(pay.createdAt), "dd MMM yyyy, h:mm a") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Guest *</Label>
              <Select value={form.guestId} onValueChange={v => setForm(f => ({ ...f, guestId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select guest" /></SelectTrigger>
                <SelectContent>
                  {activeGuests.map(g => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.guestName} — Room {g.roomNumber} — Balance ₹{parseFloat(String(g.balanceAmount || 0)).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input type="number" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={form.paymentMode} onValueChange={v => setForm(f => ({ ...f, paymentMode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Cash", "Card", "UPI", "Bank Transfer", "Cheque"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receipt">Receipt (Guest Pays)</SelectItem>
                    <SelectItem value="payment">Payment (Refund)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleRecord} disabled={createPayment.isPending}>
              {createPayment.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
