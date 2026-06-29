import { useState } from "react";
import { useLocation } from "wouter";
import { useGetGuests } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, Search, Phone, BedDouble } from "lucide-react";
import { format } from "date-fns";

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

export default function GuestsList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { data: guests, isLoading } = useGetGuests();

  const filtered = guests?.filter(g =>
    g.guestName.toLowerCase().includes(search.toLowerCase()) ||
    (g.mobile || "").includes(search) ||
    String(g.roomNumber || "").includes(search) ||
    (g.billNumber || "").toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Guests</h1>
        </div>
        <Button onClick={() => setLocation("/guests/new")} className="gap-2">
          <UserPlus className="w-4 h-4" />
          New Guest Check-In
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, mobile, bill number, room..."
              className="pl-10 h-11"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No guests found</p>
              <p className="text-sm mt-1">Try a different search or check in a new guest</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(guest => (
                <div
                  key={guest.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/guests/${guest.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-full font-bold text-lg flex-shrink-0">
                      {guest.guestName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{guest.guestName}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{guest.mobile}</span>
                        {guest.roomNumber && (
                          <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />Room {guest.roomNumber}</span>
                        )}
                        <span className="font-mono">{guest.billNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-14 sm:ml-0">
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{parseFloat(String(guest.totalAmount || 0)).toLocaleString()}</p>
                      {guest.checkInDate && (
                        <p className="text-xs text-muted-foreground">{format(new Date(guest.checkInDate), "dd MMM yyyy")}</p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[guest.status] || "bg-gray-100 text-gray-600"}`}>
                      {statusLabels[guest.status] || guest.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
