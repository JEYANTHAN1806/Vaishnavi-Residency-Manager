import { useLocation } from "wouter";
import { useState } from "react";
import { useGetGuests, useCheckOutGuest } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Search, Printer } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function CheckOut() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { data: guests, isLoading, refetch } = useGetGuests();
  const checkoutMutation = useCheckOutGuest();

  const checkedIn = guests?.filter(g => g.status === "checked-in" && (
    !search || g.guestName.toLowerCase().includes(search.toLowerCase()) || (g.mobile || "").includes(search) || String(g.roomNumber || "").includes(search)
  )) || [];

  const handleCheckout = (id: number, name: string) => {
    checkoutMutation.mutate(
      { id, data: {} },
      {
        onSuccess: () => {
          toast.success(`${name} checked out successfully!`);
          refetch();
        },
        onError: () => toast.error("Failed to check out"),
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <LogOut className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Check Out</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">Currently Checked-In Guests</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, mobile, or room..."
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
          ) : checkedIn.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <LogOut className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No guests currently checked in</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checkedIn.map(guest => {
                const checkOutDate = guest.expectedCheckOutDate || guest.actualCheckOutDate;
                const nights = checkOutDate && guest.checkInDate
                  ? Math.max(1, Math.round((new Date(checkOutDate).getTime() - new Date(guest.checkInDate).getTime()) / 86400000))
                  : (guest.numberOfDays || 1);
                const balance = parseFloat(String(guest.balanceAmount || 0));
                return (
                  <div key={guest.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{guest.guestName}</span>
                        <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">Checked In</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Room {guest.roomNumber} · {guest.mobile}</p>
                      <p className="text-xs text-muted-foreground">
                        {guest.checkInDate ? format(new Date(guest.checkInDate), "dd MMM") : "?"} →{" "}
                        {checkOutDate ? format(new Date(checkOutDate), "dd MMM yyyy") : "?"} · {nights} night{nights > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">₹{parseFloat(String(guest.totalAmount || 0)).toLocaleString()}</p>
                        <p className={`text-xs font-medium ${balance > 0 ? "text-destructive" : "text-green-600"}`}>
                          {balance > 0 ? `Balance: ₹${balance.toLocaleString()}` : "Paid"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setLocation(`/print-bills?id=${guest.id}`)} className="gap-1">
                          <Printer className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleCheckout(guest.id, guest.guestName)}
                          disabled={checkoutMutation.isPending}
                          className="gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Check Out
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
