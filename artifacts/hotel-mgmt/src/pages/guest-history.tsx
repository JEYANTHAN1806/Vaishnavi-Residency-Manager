import { useState } from "react";
import { useLocation } from "wouter";
import { useGetGuests } from "@workspace/api-client-react";
import type { Guest } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Search, Phone, BedDouble, Printer } from "lucide-react";
import { format, isValid } from "date-fns";

const safeFormat = (dateStr: string | null | undefined, fmt: string): string | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!isValid(d)) return null;
  return format(d, fmt);
};

const statusColors: Record<string, string> = {
  "checked-in": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "checked-out": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  booked: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  "checked-in": "Checked In",
  "checked-out": "Checked Out",
  booked: "Booked",
  cancelled: "Cancelled",
};

export default function GuestHistory() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { data: guests, isLoading } = useGetGuests();

  const filtered = guests?.filter(g =>
    !search ||
    g.guestName.toLowerCase().includes(search.toLowerCase()) ||
    (g.mobile || "").includes(search) ||
    (g.billNumber || "").includes(search) ||
    String(g.roomNumber || "").includes(search)
  ) || [];

  const checkedOut = filtered.filter(g => g.status === "checked-out");
  const active = filtered.filter(g => g.status !== "checked-out");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <History className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Guest History</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, mobile, room, or bill number..."
          className="pl-10 h-11 max-w-xl"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No guests found</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Guests</h2>
              {active.map(guest => <GuestRow key={guest.id} guest={guest} onPrint={() => setLocation(`/print-bills?id=${guest.id}`)} onView={() => setLocation(`/guests/${guest.id}`)} />)}
            </div>
          )}
          {checkedOut.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Past Guests</h2>
              {checkedOut.map(guest => <GuestRow key={guest.id} guest={guest} onPrint={() => setLocation(`/print-bills?id=${guest.id}`)} onView={() => setLocation(`/guests/${guest.id}`)} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GuestRow({ guest, onPrint, onView }: {
  guest: Guest;
  onPrint: () => void;
  onView: () => void;
}) {
  const checkOutDate = guest.actualCheckOutDate || guest.expectedCheckOutDate;
  const nights = checkOutDate && guest.checkInDate
    ? Math.max(1, Math.round((new Date(checkOutDate).getTime() - new Date(guest.checkInDate).getTime()) / 86400000))
    : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border hover:bg-muted/40 cursor-pointer transition-colors" onClick={onView}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-full font-bold text-lg flex-shrink-0">
          {guest.guestName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">{guest.guestName}</p>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[guest.status] || "bg-gray-100 text-gray-600"}`}>
              {statusLabels[guest.status] || guest.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{guest.mobile}</span>
            {guest.roomNumber && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />Room {guest.roomNumber}</span>}
            {guest.billNumber && <span className="font-mono">{guest.billNumber}</span>}
            {guest.checkInDate && safeFormat(guest.checkInDate, "dd MMM yy") && (
              <span>
                {safeFormat(guest.checkInDate, "dd MMM yy")}
                {checkOutDate && safeFormat(checkOutDate, "dd MMM yy") && ` → ${safeFormat(checkOutDate, "dd MMM yy")}`}
                {nights && ` (${nights}N)`}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 ml-14 sm:ml-0">
        <div className="text-right">
          <p className="text-sm font-semibold">₹{parseFloat(String(guest.totalAmount || 0)).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Adv: ₹{parseFloat(String(guest.advancePaid || 0)).toLocaleString()}</p>
          {parseFloat(String(guest.balanceAmount || 0)) > 0 && (
            <p className="text-xs text-destructive font-medium">Bal: ₹{parseFloat(String(guest.balanceAmount)).toLocaleString()}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); onPrint(); }} className="gap-1">
          <Printer className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
