import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateGuest, useGetRooms } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserPlus, ArrowLeft, Banknote, CreditCard, Smartphone } from "lucide-react";

type PaymentMode = "Cash" | "UPI" | "Card";

const paymentModeOptions: { value: PaymentMode; label: string; icon: React.ReactNode }[] = [
  { value: "Cash", label: "Cash", icon: <Banknote className="w-4 h-4" /> },
  { value: "UPI", label: "UPI", icon: <Smartphone className="w-4 h-4" /> },
  { value: "Card", label: "Card", icon: <CreditCard className="w-4 h-4" /> },
];

export default function NewGuest() {
  const [, setLocation] = useLocation();
  const createGuest = useCreateGuest();
  const { data: rooms } = useGetRooms();

  const [form, setForm] = useState({
    guestName: "",
    mobile: "",
    address: "",
    idProofType: "Aadhaar",
    aadhaarNumber: "",
    gender: "",
    age: "",
    pax: "1",
    roomId: "",
    checkInDate: new Date().toISOString().slice(0, 10),
    expectedCheckOutDate: "",
    advancePaid: "0",
    paymentMode: "Cash" as PaymentMode,
    remarks: "",
  });

  const availableRooms = rooms?.filter(r => r.status === "available") || [];

  const selectedRoom = rooms?.find(r => String(r.id) === form.roomId);
  const nights = form.expectedCheckOutDate && form.checkInDate
    ? Math.max(1, Math.round((new Date(form.expectedCheckOutDate).getTime() - new Date(form.checkInDate).getTime()) / 86400000))
    : 1;
  const rentPerDay = selectedRoom ? parseFloat(String(selectedRoom.rentPerDay)) : 0;
  const totalAmount = rentPerDay * nights;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestName || !form.mobile || !form.roomId || !form.expectedCheckOutDate) {
      toast.error("Please fill all required fields");
      return;
    }
    const advance = parseFloat(form.advancePaid) || 0;
    const balance = Math.max(0, totalAmount - advance);
    createGuest.mutate(
      {
        data: {
          guestName: form.guestName,
          mobile: form.mobile,
          address: form.address || undefined,
          idProofType: form.idProofType || undefined,
          aadhaarNumber: form.aadhaarNumber || undefined,
          gender: form.gender || undefined,
          age: form.age ? parseInt(form.age) : undefined,
          pax: parseInt(form.pax) || 1,
          roomId: parseInt(form.roomId),
          checkInDate: form.checkInDate,
          expectedCheckOutDate: form.expectedCheckOutDate,
          numberOfDays: nights,
          rentPerDay,
          totalAmount,
          advancePaid: advance,
          balanceAmount: balance,
          paymentMode: form.paymentMode,
          remarks: form.remarks || undefined,
        },
      },
      {
        onSuccess: (data) => {
          toast.success(`Guest registered! Bill No: ${data.billNumber}`);
          setLocation("/guests");
        },
        onError: (err: unknown) => {
          const msg = (err as { message?: string })?.message || "Failed to register guest";
          toast.error(msg);
        },
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <UserPlus className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">New Guest Check-In</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Guest Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Guest Name *</Label>
                <Input placeholder="Full name" value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>Mobile *</Label>
                <Input placeholder="Mobile number" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    {["Male", "Female", "Other"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" min="1" max="120" placeholder="Age" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>ID Proof Type</Label>
                <Select value={form.idProofType} onValueChange={v => setForm(f => ({ ...f, idProofType: v }))}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Aadhaar", "PAN", "Passport", "Voter ID", "Driving License"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Aadhaar / ID Number</Label>
                <Input placeholder="ID card number" value={form.aadhaarNumber} onChange={e => setForm(f => ({ ...f, aadhaarNumber: e.target.value }))} className="h-11" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <Textarea placeholder="Home address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Stay Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Room *</Label>
                <Select value={form.roomId} onValueChange={v => setForm(f => ({ ...f, roomId: v }))}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select room" /></SelectTrigger>
                  <SelectContent>
                    {availableRooms.map(r => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        Room {r.roomNumber} — {r.type} {r.acType ? `(${r.acType})` : ""} — ₹{r.rentPerDay}/day
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>No. of Guests (PAX)</Label>
                <Input type="number" min="1" max="20" value={form.pax} onChange={e => setForm(f => ({ ...f, pax: e.target.value }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>Check-In Date *</Label>
                <Input type="date" value={form.checkInDate} onChange={e => setForm(f => ({ ...f, checkInDate: e.target.value }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>Expected Check-Out Date *</Label>
                <Input type="date" value={form.expectedCheckOutDate} min={form.checkInDate} onChange={e => setForm(f => ({ ...f, expectedCheckOutDate: e.target.value }))} className="h-11" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Remarks</Label>
                <Textarea placeholder="Special requests or notes" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={2} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader><CardTitle>Billing Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Type</span>
                  <span className="font-medium">{selectedRoom?.type || "—"}</span>
                </div>
                {selectedRoom?.acType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AC Type</span>
                    <span className="font-medium">{selectedRoom.acType}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room No.</span>
                  <span className="font-medium">{selectedRoom?.roomNumber || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate/Day</span>
                  <span className="font-medium">₹{rentPerDay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nights</span>
                  <span className="font-medium">{form.expectedCheckOutDate ? nights : "—"}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-base font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary">₹{totalAmount || 0}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <div className="flex gap-2">
                  {paymentModeOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, paymentMode: opt.value }))}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                        form.paymentMode === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Advance Payment (₹)</Label>
                <Input type="number" min="0" value={form.advancePaid} onChange={e => setForm(f => ({ ...f, advancePaid: e.target.value }))} className="h-11" />
              </div>
              <div className="flex justify-between text-sm font-medium text-muted-foreground">
                <span>Balance Due</span>
                <span className="text-destructive">₹{Math.max(0, totalAmount - parseFloat(form.advancePaid || "0"))}</span>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={createGuest.isPending}>
                {createGuest.isPending ? "Registering..." : "Check In Guest"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
