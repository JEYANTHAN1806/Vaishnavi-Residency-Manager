import { useRef, useState } from "react";
import { useSearch, useLocation } from "wouter";
import { useGetGuests, useGetGuest, useGetSettings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function PrintBills() {
  const [, setLocation] = useLocation();
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const search = useSearch();
  const params = new URLSearchParams(search);
  const urlId = params.get("id");
  const effectiveId = urlId ? parseInt(urlId) : (selectedGuestId ? parseInt(selectedGuestId) : 0);

  const { data: guests } = useGetGuests();
  const { data: settings } = useGetSettings();
  const { data: guest, isLoading } = useGetGuest(effectiveId || 0);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) { alert("Please allow popups to print"); return; }
    win.document.write(`
      <html><head><title>Bill - ${guest?.billNumber || ""}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #000; background: #fff; }
        .bill { max-width: 700px; margin: 20px auto; padding: 24px; border: 2px solid #1E3A8A; }
        .header { text-align: center; border-bottom: 2px solid #1E3A8A; padding-bottom: 16px; margin-bottom: 16px; }
        .hotel-name { font-size: 22px; font-weight: bold; color: #1E3A8A; }
        .bill-title { font-size: 16px; font-weight: bold; letter-spacing: 2px; margin-top: 12px; color: #1E3A8A; border: 1px solid #1E3A8A; display: inline-block; padding: 4px 16px; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; padding: 12px; background: #f8faff; border: 1px solid #dce4f5; }
        .meta-group label { font-size: 10px; color: #666; text-transform: uppercase; }
        .meta-group p { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #1E3A8A; color: white; padding: 8px 10px; text-align: left; font-size: 12px; }
        td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
        .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #666; border-top: 1px dashed #ccc; padding-top: 12px; }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const checkOutDate = guest?.actualCheckOutDate || guest?.expectedCheckOutDate;
  const nights = checkOutDate && guest?.checkInDate
    ? Math.max(1, Math.round((new Date(checkOutDate).getTime() - new Date(guest.checkInDate).getTime()) / 86400000))
    : (guest?.numberOfDays || 1);
  const rentPerDay = parseFloat(String(guest?.rentPerDay || 0));
  const roomCharge = rentPerDay * nights;
  const taxRate = settings?.taxEnabled ? parseFloat(String(settings.taxRate || 0)) / 100 : 0;
  const taxAmount = roomCharge * taxRate;
  const grossTotal = roomCharge + taxAmount + parseFloat(String(guest?.extraCharges || 0)) - parseFloat(String(guest?.discount || 0));
  const advancePaid = parseFloat(String(guest?.advancePaid || 0));
  const balance = Math.max(0, grossTotal - advancePaid);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/guests")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Printer className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Print Bills</h1>
        </div>
      </div>

      {!urlId && (
        <Card>
          <CardContent className="p-4">
            <div className="max-w-lg">
              <Select value={selectedGuestId} onValueChange={setSelectedGuestId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select a guest to print bill" /></SelectTrigger>
                <SelectContent>
                  {guests?.map(g => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.guestName} — {g.billNumber} — Room {g.roomNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && effectiveId > 0 && (
        <Skeleton className="h-[600px] w-full" />
      )}

      {guest && effectiveId > 0 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handlePrint} className="gap-2" size="lg">
              <Printer className="w-4 h-4" /> Print Bill
            </Button>
          </div>

          <div ref={printRef} className="bill" style={{ maxWidth: 700, margin: "0 auto", padding: 24, border: "2px solid #1E3A8A", fontFamily: "Arial, sans-serif", fontSize: 13, color: "#000", background: "#fff" }}>
            <div style={{ textAlign: "center", borderBottom: "2px solid #1E3A8A", paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 22, fontWeight: "bold", color: "#1E3A8A" }}>{settings?.hotelName || "Vaishnavi Residency"}</div>
              {settings?.tagline && <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{settings.tagline}</div>}
              {settings?.address && <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{settings.address}</div>}
              <div style={{ fontSize: 11, color: "#666" }}>
                {settings?.phone && `Ph: ${settings.phone}`}
                {settings?.phone && settings?.email && " | "}
                {settings?.email && `Email: ${settings.email}`}
              </div>
              {settings?.gstin && <div style={{ fontSize: 11, color: "#666" }}>GSTIN: {settings.gstin}</div>}
              <div style={{ fontSize: 16, fontWeight: "bold", letterSpacing: 2, marginTop: 12, color: "#1E3A8A", border: "1px solid #1E3A8A", display: "inline-block", padding: "4px 16px" }}>
                TAX INVOICE
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, padding: 12, background: "#f8faff", border: "1px solid #dce4f5" }}>
              {([
                ["Guest Name", guest.guestName],
                ["Bill Number", guest.billNumber],
                ["Mobile", guest.mobile],
                ["Room No.", `Room ${guest.roomNumber}`],
                ["Check-In", guest.checkInDate ? format(new Date(guest.checkInDate), "dd MMM yyyy") : "—"],
                ["Check-Out", checkOutDate ? format(new Date(checkOutDate), "dd MMM yyyy") : "—"],
                ...(guest.idProofType ? [["ID Type", guest.idProofType]] : []),
                ...(guest.aadhaarNumber ? [["ID Number", guest.aadhaarNumber]] : []),
              ] as [string, string][]).map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                  <div style={{ fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
              <thead>
                <tr>
                  {["Description", "Nights", "Rate/Day", "Amount"].map((h, i) => (
                    <th key={h} style={{ background: "#1E3A8A", color: "white", padding: "8px 10px", textAlign: i > 0 ? "right" as const : "left" as const, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid #e5e7eb" }}>
                    Room {guest.roomNumber} Accommodation<br />
                    <span style={{ fontSize: 11, color: "#666" }}>
                      {guest.checkInDate ? format(new Date(guest.checkInDate), "dd MMM") : ""} to {checkOutDate ? format(new Date(checkOutDate), "dd MMM yyyy") : ""}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{nights}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>₹{rentPerDay.toLocaleString()}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>₹{roomCharge.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginLeft: "auto", width: 280 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr><td style={{ padding: "5px 10px", color: "#555" }}>Sub Total</td><td style={{ padding: "5px 10px", textAlign: "right" }}>₹{roomCharge.toLocaleString()}</td></tr>
                  {(guest.extraCharges || 0) > 0 && (
                    <tr><td style={{ padding: "5px 10px", color: "#555" }}>Extra Charges</td><td style={{ padding: "5px 10px", textAlign: "right" }}>₹{parseFloat(String(guest.extraCharges)).toLocaleString()}</td></tr>
                  )}
                  {(guest.discount || 0) > 0 && (
                    <tr><td style={{ padding: "5px 10px", color: "#059669" }}>Discount</td><td style={{ padding: "5px 10px", textAlign: "right", color: "#059669" }}>- ₹{parseFloat(String(guest.discount)).toLocaleString()}</td></tr>
                  )}
                  {settings?.taxEnabled && (
                    <tr><td style={{ padding: "5px 10px", color: "#555" }}>GST ({settings.taxRate}%)</td><td style={{ padding: "5px 10px", textAlign: "right" }}>₹{taxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td></tr>
                  )}
                  <tr style={{ fontWeight: "bold", fontSize: 14, borderTop: "2px solid #1E3A8A" }}>
                    <td style={{ padding: "8px 10px" }}>Grand Total</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "#1E3A8A" }}>₹{grossTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr><td style={{ padding: "5px 10px", color: "#059669" }}>Advance Paid</td><td style={{ padding: "5px 10px", textAlign: "right", color: "#059669" }}>- ₹{advancePaid.toLocaleString()}</td></tr>
                  <tr style={{ fontWeight: "bold", fontSize: 15, borderTop: "2px solid #dc2626", color: "#dc2626" }}>
                    <td style={{ padding: "8px 10px" }}>Balance Due</td>
                    <td style={{ padding: "8px 10px", textAlign: "right" }}>₹{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <div><div style={{ borderTop: "1px solid #000", paddingTop: 4, width: 160, textAlign: "center" }}>Guest Signature</div></div>
              <div style={{ textAlign: "right" }}>
                <div style={{ marginBottom: 32 }}>For {settings?.hotelName || "Vaishnavi Residency"}</div>
                <div style={{ borderTop: "1px solid #000", paddingTop: 4, width: 160, textAlign: "center" }}>Authorized Signatory</div>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "#666", borderTop: "1px dashed #ccc", paddingTop: 12 }}>
              <p>Thank you for staying with us! We hope to see you again.</p>
              {settings?.website && <p style={{ marginTop: 4 }}>{settings.website}</p>}
            </div>
          </div>
        </div>
      )}

      {!effectiveId && (
        <div className="text-center py-16 text-muted-foreground">
          <Printer className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Select a guest to preview and print their bill</p>
        </div>
      )}
    </div>
  );
}
