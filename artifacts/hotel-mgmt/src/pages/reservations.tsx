import { useState } from "react";
import { useGetReservations, useCreateReservation, useGetRooms } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  reserved: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const emptyForm = {
  guestName: "", mobile: "", roomId: "",
  checkInDate: new Date().toISOString().slice(0, 10), checkOutDate: "",
  advance: "0", remarks: "",
};

export default function Reservations() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { data: reservations, isLoading, refetch } = useGetReservations();
  const { data: rooms } = useGetRooms();
  const createReservation = useCreateReservation();

  const availableRooms = rooms?.filter(r => r.status === "available" || r.status === "reserved") || [];

  const filtered = reservations?.filter(r =>
    !search || r.guestName.toLowerCase().includes(search.toLowerCase()) || (r.mobile || "").includes(search)
  ) || [];

  const selectedRoom = rooms?.find(r => String(r.id) === form.roomId);
  const nights = form.checkOutDate && form.checkInDate
    ? Math.max(1, Math.round((new Date(form.checkOutDate).getTime() - new Date(form.checkInDate).getTime()) / 86400000))
    : 1;
  const totalAmount = selectedRoom ? parseFloat(String(selectedRoom.rentPerDay)) * nights : 0;

  const handleCreate = () => {
    if (!form.guestName || !form.mobile || !form.roomId || !form.checkOutDate) {
      toast.error("Please fill all required fields");
      return;
    }
    createReservation.mutate(
      {
        data: {
          guestName: form.guestName,
          mobile: form.mobile,
          roomId: parseInt(form.roomId),
          checkInDate: form.checkInDate,
          checkOutDate: form.checkOutDate,
          advance: parseFloat(form.advance) || 0,
          remarks: form.remarks || undefined,
        },
      },
      {
        onSuccess: (data) => {
          toast.success(`Reservation created! ${data.reservationNumber}`);
          setOpen(false);
          setForm(emptyForm);
          refetch();
        },
        onError: () => toast.error("Failed to create reservation"),
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarCheck className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Reservation
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or mobile..." className="pl-10 h-11" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No reservations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Res. No.", "Guest", "Room", "Check-In", "Check-Out", "Advance", "Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(res => (
                    <tr key={res.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-primary">{res.reservationNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{res.guestName}</p>
                        <p className="text-xs text-muted-foreground">{res.mobile}</p>
                      </td>
                      <td className="px-4 py-3">{res.roomNumber || "—"}</td>
                      <td className="px-4 py-3">{res.checkInDate ? format(new Date(res.checkInDate), "dd MMM yy") : "—"}</td>
                      <td className="px-4 py-3">{res.checkOutDate ? format(new Date(res.checkOutDate), "dd MMM yy") : "—"}</td>
                      <td className="px-4 py-3">₹{parseFloat(String(res.advance || 0)).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[res.status] || "bg-gray-100 text-gray-600"}`}>
                          {res.status}
                        </span>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Reservation</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Guest Name *</Label>
              <Input value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Mobile *</Label>
              <Input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="Mobile number" />
            </div>
            <div className="space-y-2">
              <Label>Room *</Label>
              <Select value={form.roomId} onValueChange={v => setForm(f => ({ ...f, roomId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                <SelectContent>
                  {availableRooms.map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>Room {r.roomNumber} — {r.type} — ₹{r.rentPerDay}/day</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Advance (₹)</Label>
              <Input type="number" min="0" value={form.advance} onChange={e => setForm(f => ({ ...f, advance: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Check-In Date *</Label>
              <Input type="date" value={form.checkInDate} onChange={e => setForm(f => ({ ...f, checkInDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Check-Out Date *</Label>
              <Input type="date" value={form.checkOutDate} min={form.checkInDate} onChange={e => setForm(f => ({ ...f, checkOutDate: e.target.value }))} />
            </div>
            {form.checkOutDate && selectedRoom && (
              <div className="md:col-span-2 p-3 bg-muted rounded-lg text-sm flex justify-between">
                <span className="text-muted-foreground">Total Amount ({nights} nights × ₹{selectedRoom.rentPerDay})</span>
                <span className="font-bold text-primary">₹{totalAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label>Remarks</Label>
              <Input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createReservation.isPending}>
              {createReservation.isPending ? "Creating..." : "Create Reservation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
