import { useState } from "react";
import { useGetRooms, useCreateRoom, useUpdateRoom } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { BedDouble, Plus, Pencil, Wind, Thermometer } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  occupied: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cleaning: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  reserved: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

type RoomStatusValue = "available" | "occupied" | "cleaning" | "reserved";
type AcTypeValue = "AC" | "Non-AC";

const emptyForm = {
  roomNumber: "",
  type: "Standard",
  acType: "Non-AC" as AcTypeValue,
  rentPerDay: "",
  floor: "",
  description: "",
  status: "available" as RoomStatusValue,
};

export default function Rooms() {
  const { data: rooms, isLoading, refetch } = useGetRooms();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const handleOpen = (room?: {
    id: number; roomNumber: string; type: string; acType?: string;
    rentPerDay: number | string; floor?: string | null; description?: string | null; status: string;
  }) => {
    if (room) {
      setEditingId(room.id);
      setForm({
        roomNumber: room.roomNumber,
        type: room.type,
        acType: (room.acType as AcTypeValue) || "Non-AC",
        rentPerDay: String(room.rentPerDay),
        floor: room.floor || "",
        description: room.description || "",
        status: (room.status as RoomStatusValue) || "available",
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.roomNumber || !form.rentPerDay) {
      toast.error("Room number and rate are required");
      return;
    }
    const payload = {
      roomNumber: form.roomNumber,
      type: form.type,
      acType: form.acType,
      rentPerDay: parseFloat(form.rentPerDay),
      floor: form.floor || undefined,
      description: form.description || undefined,
      status: form.status,
    };
    if (editingId !== null) {
      updateRoom.mutate({ id: editingId, data: payload }, {
        onSuccess: () => { toast.success("Room updated"); setOpen(false); refetch(); },
        onError: () => toast.error("Failed to update room"),
      });
    } else {
      createRoom.mutate({ data: payload }, {
        onSuccess: () => { toast.success("Room created"); setOpen(false); refetch(); },
        onError: () => toast.error("Failed to create room"),
      });
    }
  };

  const handleToggleAcType = (roomId: number, currentAcType: string) => {
    const newAcType = currentAcType === "AC" ? "Non-AC" : "AC";
    updateRoom.mutate({ id: roomId, data: { acType: newAcType } }, {
      onSuccess: () => { toast.success(`Room set to ${newAcType}`); refetch(); },
      onError: () => toast.error("Failed to update AC type"),
    });
  };

  const stats = {
    total: rooms?.length || 0,
    available: rooms?.filter(r => r.status === "available").length || 0,
    occupied: rooms?.filter(r => r.status === "occupied").length || 0,
    cleaning: rooms?.filter(r => r.status === "cleaning").length || 0,
    ac: rooms?.filter(r => r.acType === "AC").length || 0,
    nonAc: rooms?.filter(r => r.acType !== "AC").length || 0,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BedDouble className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
        </div>
        <Button onClick={() => handleOpen()} className="gap-2">
          <Plus className="w-4 h-4" /> Add Room
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "Total Rooms", value: stats.total, color: "text-primary" },
          { label: "Available", value: stats.available, color: "text-green-600" },
          { label: "Occupied", value: stats.occupied, color: "text-red-600" },
          { label: "Cleaning", value: stats.cleaning, color: "text-orange-600" },
          { label: "AC Rooms", value: stats.ac, color: "text-blue-600" },
          { label: "Non-AC Rooms", value: stats.nonAc, color: "text-gray-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold">Room No.</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">AC/Non-AC</th>
                    <th className="px-4 py-3 text-left font-semibold">Floor</th>
                    <th className="px-4 py-3 text-left font-semibold">Rate/Day</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms?.map(room => (
                    <tr key={room.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-primary">{room.roomNumber}</td>
                      <td className="px-4 py-3">{room.type}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleAcType(room.id, room.acType)}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer border ${
                            room.acType === "AC"
                              ? "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700"
                              : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600"
                          }`}
                          title="Click to toggle AC/Non-AC"
                        >
                          {room.acType === "AC" ? <Wind className="w-3 h-3" /> : <Thermometer className="w-3 h-3" />}
                          {room.acType}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{room.floor || "—"}</td>
                      <td className="px-4 py-3 font-medium">₹{parseFloat(String(room.rentPerDay)).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[room.status] || "bg-gray-100 text-gray-600"}`}>
                          {room.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon" onClick={() => handleOpen(room)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
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
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Room" : "Add New Room"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Room Number *</Label>
              <Input value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))} placeholder="e.g. 101" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Standard", "Deluxe", "Suite", "Family", "Executive"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>AC Type</Label>
              <div className="flex gap-3">
                {(["AC", "Non-AC"] as AcTypeValue[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, acType: type }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 font-semibold text-sm transition-all ${
                      form.acType === type
                        ? type === "AC"
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          : "border-gray-400 bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        : "border-border bg-transparent text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {type === "AC" ? <Wind className="w-4 h-4" /> : <Thermometer className="w-4 h-4" />}
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rate/Day (₹) *</Label>
              <Input type="number" value={form.rentPerDay} onChange={e => setForm(f => ({ ...f, rentPerDay: e.target.value }))} placeholder="1500" />
            </div>
            <div className="space-y-2">
              <Label>Floor</Label>
              <Input value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} placeholder="Ground Floor" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as RoomStatusValue }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["available", "occupied", "cleaning", "reserved"] as RoomStatusValue[]).map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createRoom.isPending || updateRoom.isPending}>
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
