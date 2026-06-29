import { useState } from "react";
import { useLocation } from "wouter";
import { useGetGuests, useCheckInGuest } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn, Search, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function CheckIn() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { data: guests, isLoading, refetch } = useGetGuests();
  const checkinMutation = useCheckInGuest();

  const pending = guests?.filter(g => g.status === "booked" && (
    !search || g.guestName.toLowerCase().includes(search.toLowerCase()) || (g.mobile || "").includes(search)
  )) || [];

  const handleCheckin = (id: number) => {
    checkinMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Guest checked in successfully!");
          refetch();
        },
        onError: () => toast.error("Failed to check in"),
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LogIn className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Check In</h1>
        </div>
        <Button onClick={() => setLocation("/guests/new")} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Walk-in Guest
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">Guests Pending Check-In</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or mobile..."
              className="pl-10 h-11"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <LogIn className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No pending check-ins</p>
              <p className="text-sm mt-1">All bookings are up to date</p>
              <Button variant="outline" className="mt-4" onClick={() => setLocation("/guests/new")}>
                Add Walk-in Guest
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map(guest => (
                <div key={guest.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border bg-yellow-50/50 dark:bg-yellow-900/10">
                  <div>
                    <p className="font-semibold text-foreground">{guest.guestName}</p>
                    <p className="text-sm text-muted-foreground">{guest.mobile} · Room {guest.roomNumber}</p>
                    {guest.checkInDate && (
                      <p className="text-xs text-muted-foreground">
                        Check-in: {format(new Date(guest.checkInDate), "dd MMM yyyy")}
                        {guest.expectedCheckOutDate ? ` → ${format(new Date(guest.expectedCheckOutDate), "dd MMM yyyy")}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold">₹{parseFloat(String(guest.advancePaid || 0)).toLocaleString()} advance</p>
                      <p className="text-xs text-muted-foreground">Total: ₹{parseFloat(String(guest.totalAmount || 0)).toLocaleString()}</p>
                    </div>
                    <Button
                      onClick={() => handleCheckin(guest.id)}
                      disabled={checkinMutation.isPending}
                      className="gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Check In
                    </Button>
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
