import { useRoute, useLocation } from "wouter";
import { useGetGuest, useCheckOutGuest } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer, LogOut, Phone, MapPin, BedDouble, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  "checked-in": "bg-green-100 text-green-700",
  "checked-out": "bg-gray-100 text-gray-600",
  booked: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  "checked-in": "Checked In",
  "checked-out": "Checked Out",
  booked: "Booked",
  cancelled: "Cancelled",
};

export default function GuestDetail() {
  const [, params] = useRoute("/guests/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0");
  const { data: guest, isLoading, refetch } = useGetGuest(id);
  const checkoutMutation = useCheckOutGuest();

  const handleCheckout = () => {
    if (!guest) return;
    checkoutMutation.mutate(
      { id: guest.id, data: {} },
      {
        onSuccess: () => {
          toast.success("Guest checked out successfully");
          refetch();
        },
        onError: () => toast.error("Failed to check out"),
      }
    );
  };

  if (isLoading) return (
    <div className="space-y-4 animate-in fade-in">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (!guest) return (
    <div className="text-center py-16 text-muted-foreground">Guest not found</div>
  );

  const checkOutDate = guest.actualCheckOutDate || guest.expectedCheckOutDate;
  const nights = checkOutDate && guest.checkInDate
    ? Math.max(1, Math.round((new Date(checkOutDate).getTime() - new Date(guest.checkInDate).getTime()) / 86400000))
    : (guest.numberOfDays || 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/guests")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{guest.guestName}</h1>
            <p className="text-sm text-muted-foreground font-mono">{guest.billNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation(`/print-bills?id=${guest.id}`)} className="gap-2">
            <Printer className="w-4 h-4" /> Print Bill
          </Button>
          {guest.status === "checked-in" && (
            <Button onClick={handleCheckout} disabled={checkoutMutation.isPending} className="gap-2">
              <LogOut className="w-4 h-4" />
              {checkoutMutation.isPending ? "Checking Out..." : "Check Out"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Guest Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Mobile</p>
                  <p className="font-medium">{guest.mobile}</p>
                </div>
              </div>
              {guest.alternativeMobile && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Alt. Mobile</p>
                    <p className="font-medium">{guest.alternativeMobile}</p>
                  </div>
                </div>
              )}
              {guest.address && (
                <div className="flex items-center gap-3 md:col-span-2">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Address</p>
                    <p className="font-medium">{guest.address}</p>
                  </div>
                </div>
              )}
              {guest.idProofType && (
                <div>
                  <p className="text-muted-foreground text-xs">ID Proof Type</p>
                  <p className="font-medium">{guest.idProofType}</p>
                </div>
              )}
              {guest.aadhaarNumber && (
                <div>
                  <p className="text-muted-foreground text-xs">ID / Aadhaar No.</p>
                  <p className="font-medium">{guest.aadhaarNumber}</p>
                </div>
              )}
              {guest.gender && (
                <div>
                  <p className="text-muted-foreground text-xs">Gender</p>
                  <p className="font-medium">{guest.gender}</p>
                </div>
              )}
              {guest.age && (
                <div>
                  <p className="text-muted-foreground text-xs">Age</p>
                  <p className="font-medium">{guest.age} yrs</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Stay Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <BedDouble className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Room</p>
                  <p className="font-medium">Room {guest.roomNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Check-In</p>
                  <p className="font-medium">{guest.checkInDate ? format(new Date(guest.checkInDate), "dd MMM yyyy") : "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Check-Out</p>
                  <p className="font-medium">{checkOutDate ? format(new Date(checkOutDate), "dd MMM yyyy") : "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Nights</p>
                <p className="font-medium">{nights}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">PAX (Guests)</p>
                <p className="font-medium">{guest.pax || 1}</p>
              </div>
              {guest.paymentMode && (
                <div>
                  <p className="text-muted-foreground text-xs">Payment Mode</p>
                  <p className="font-medium">{guest.paymentMode}</p>
                </div>
              )}
              {guest.remarks && (
                <div className="md:col-span-3">
                  <p className="text-muted-foreground text-xs">Remarks</p>
                  <p className="font-medium">{guest.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Billing</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[guest.status] || "bg-gray-100 text-gray-600"}`}>
                  {statusLabels[guest.status] || guest.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate/Day</span>
                <span className="font-medium">₹{parseFloat(String(guest.rentPerDay || 0)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nights</span>
                <span className="font-medium">{nights}</span>
              </div>
              {(guest.extraCharges || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Extra Charges</span>
                  <span className="font-medium">₹{parseFloat(String(guest.extraCharges)).toLocaleString()}</span>
                </div>
              )}
              {(guest.discount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium text-green-600">- ₹{parseFloat(String(guest.discount)).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">₹{parseFloat(String(guest.totalAmount || 0)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Advance Paid</span>
                <span className="font-medium text-green-600">₹{parseFloat(String(guest.advancePaid || 0)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-3 font-bold text-base">
                <span>Balance Due</span>
                <span className={parseFloat(String(guest.balanceAmount || 0)) > 0 ? "text-destructive" : "text-green-600"}>
                  ₹{parseFloat(String(guest.balanceAmount || 0)).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full gap-2" variant="outline" onClick={() => setLocation(`/payments`)}>
            <CreditCard className="w-4 h-4" /> Record Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
