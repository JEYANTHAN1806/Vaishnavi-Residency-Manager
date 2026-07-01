import { useRef, useState } from "react";
import { useSearch, useLocation } from "wouter";
import {
  useGetGuests,
  useGetGuest,
  useGetSettings,
  type Guest,
  type Settings,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, ArrowLeft, MessageCircle } from "lucide-react";
import { format, isValid } from "date-fns";

function safeFormat(dateStr: string | null | undefined, fmt: string, fallback = "—"): string {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  return isValid(d) ? format(d, fmt) : fallback;
}

function buildBillHtml(
   guest: Guest,
  settings: Settings | undefined,
  nights: number,
  rentPerDay: number,
  roomCharge: number,
  taxAmount: number,
  grossTotal: number,
  advancePaid: number,
  balance: number,
  checkOutDate: string | null | undefined,
  copyLabel: string
): string {
  const hotelName = settings?.hotelName || "Vaishnavi Residency";
  return `
    <div class="bill">
      <div style="text-align:right;margin-bottom:4px;">
        <span style="font-size:11px;font-weight:bold;color:#1E3A8A;background:#e8f0fe;border:1px solid #1E3A8A;padding:2px 10px;border-radius:4px;letter-spacing:1px;">${copyLabel}</span>
      </div>
      <div style="text-align:center;border-bottom:2px solid #1E3A8A;padding-bottom:12px;margin-bottom:14px;">
        <div style="font-size:22px;font-weight:bold;color:#1E3A8A;">${hotelName}</div>
        ${settings?.tagline ? `<div style="font-size:12px;color:#555;margin-top:2px;">${settings.tagline}</div>` : ""}
        ${settings?.address ? `<div style="font-size:11px;color:#666;margin-top:4px;">${settings.address}</div>` : ""}
        <div style="font-size:11px;color:#666;">
          ${settings?.phone ? `Ph: ${settings.phone}` : ""}
          ${settings?.phone && settings?.email ? " | " : ""}
          ${settings?.email ? `Email: ${settings.email}` : ""}
        </div>
        ${settings?.gstin ? `<div style="font-size:11px;color:#666;">GSTIN: ${settings.gstin}</div>` : ""}
        <div style="font-size:15px;font-weight:bold;letter-spacing:2px;margin-top:10px;color:#1E3A8A;border:1px solid #1E3A8A;display:inline-block;padding:3px 14px;">TAX INVOICE</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;padding:10px;background:#f8faff;border:1px solid #dce4f5;border-radius:4px;">
        ${[
          ["Guest Name", guest.guestName],
          ["Bill Number", guest.billNumber],
          ["Mobile", guest.mobile],
          ["Room No.", `Room ${guest.roomNumber}`],
          ["AC Type", (guest as { acType?: string }).acType || "—"],
          ["Check-In", safeFormat(guest.checkInDate, "dd MMM yyyy")],
          ["Check-Out", safeFormat(checkOutDate, "dd MMM yyyy")],
          ["Payment Mode", guest.paymentMode || "Cash"],
          ...(guest.idProofType ? [["ID Type", guest.idProofType]] : []),
          ...(guest.aadhaarNumber ? [["ID Number", guest.aadhaarNumber]] : []),
        ].map(([label, val]) => `
          <div>
            <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">${label}</div>
            <div style="font-weight:600;">${val}</div>
          </div>
        `).join("")}
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
        <thead>
          <tr>
            ${["Description", "Nights", "Rate/Day", "Amount"].map((h, i) =>
              `<th style="background:#1E3A8A;color:white;padding:7px 9px;text-align:${i > 0 ? "right" : "left"};font-size:12px;">${h}</th>`
            ).join("")}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:7px 9px;border-bottom:1px solid #e5e7eb;">
              Room ${guest.roomNumber} Accommodation<br/>
              <span style="font-size:11px;color:#666;">
                ${safeFormat(guest.checkInDate, "dd MMM")} to ${safeFormat(checkOutDate, "dd MMM yyyy")}
              </span>
            </td>
            <td style="padding:7px 9px;border-bottom:1px solid #e5e7eb;text-align:right;">${nights}</td>
            <td style="padding:7px 9px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${rentPerDay.toLocaleString()}</td>
            <td style="padding:7px 9px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${roomCharge.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-left:auto;width:280px;">
        <table style="width:100%;border-collapse:collapse;">
          <tbody>
            <tr><td style="padding:5px 9px;color:#555;">Sub Total</td><td style="padding:5px 9px;text-align:right;">₹${roomCharge.toLocaleString()}</td></tr>
            ${(guest.extraCharges || 0) > 0 ? `<tr><td style="padding:5px 9px;color:#555;">Extra Charges</td><td style="padding:5px 9px;text-align:right;">₹${parseFloat(String(guest.extraCharges)).toLocaleString()}</td></tr>` : ""}
            ${(guest.discount || 0) > 0 ? `<tr><td style="padding:5px 9px;color:#059669;">Discount</td><td style="padding:5px 9px;text-align:right;color:#059669;">- ₹${parseFloat(String(guest.discount)).toLocaleString()}</td></tr>` : ""}
            ${settings?.taxEnabled ? `<tr><td style="padding:5px 9px;color:#555;">GST (${settings.taxRate}%)</td><td style="padding:5px 9px;text-align:right;">₹${taxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td></tr>` : ""}
            <tr style="font-weight:bold;font-size:13px;border-top:2px solid #1E3A8A;">
              <td style="padding:7px 9px;">Grand Total</td>
              <td style="padding:7px 9px;text-align:right;color:#1E3A8A;">₹${grossTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
            </tr>
            <tr><td style="padding:5px 9px;color:#059669;">Advance Paid (${guest.paymentMode || "Cash"})</td><td style="padding:5px 9px;text-align:right;color:#059669;">- ₹${advancePaid.toLocaleString()}</td></tr>
            <tr style="font-weight:bold;font-size:14px;border-top:2px solid #dc2626;color:#dc2626;">
              <td style="padding:7px 9px;">Balance Due</td>
              <td style="padding:7px 9px;text-align:right;">₹${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-top:28px;display:flex;justify-content:space-between;font-size:11px;">
        <div><div style="border-top:1px solid #000;padding-top:4px;width:160px;text-align:center;">Guest Signature</div></div>
        <div style="text-align:right;">
          <div style="margin-bottom:28px;">For ${hotelName}</div>
          <div style="border-top:1px solid #000;padding-top:4px;width:160px;text-align:center;">Authorized Signatory</div>
        </div>
      </div>
      <div style="margin-top:20px;text-align:center;font-size:11px;color:#666;border-top:1px dashed #ccc;padding-top:10px;">
        <p>Thank you for staying with us! We hope to see you again.</p>
        ${settings?.website ? `<p style="margin-top:4px;">${settings.website}</p>` : ""}
      </div>
    </div>
  `;
}

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

  const handlePrint = () => {
    if (!guest) return;
    const win = window.open("", "_blank", "width=820,height=1100");
    if (!win) { alert("Please allow popups to print"); return; }

    const guestCopy = buildBillHtml(guest, settings, nights, rentPerDay, roomCharge, taxAmount, grossTotal, advancePaid, balance, checkOutDate, "GUEST COPY");
    const hotelCopy = buildBillHtml(guest, settings, nights, rentPerDay, roomCharge, taxAmount, grossTotal, advancePaid, balance, checkOutDate, "HOTEL COPY");

    win.document.write(`
      <html>
      <head>
        <title>Bill - ${guest.billNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 13px; color: #000; background: #fff; }
          .bill { max-width: 700px; margin: 20px auto; padding: 20px; border: 2px solid #1E3A8A; }
          .page-break { page-break-after: always; }
          @media print {
            .page-break { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        <div class="page-break">${guestCopy}</div>
        <div>${hotelCopy}</div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const handleWhatsApp = () => {
    if (!guest) return;
    const mobile = (guest.mobile ?? "").replace(/\D/g, "");
const intlMobile = mobile.startsWith("91") ? mobile : `91${mobile}`;
    const checkIn = safeFormat(guest.checkInDate, "dd MMM yyyy");
    const checkOut = safeFormat(checkOutDate, "dd MMM yyyy");
    const msg = [
      `*${settings?.hotelName || "Vaishnavi Residency"} — Booking Confirmation*`,
      ``,
      `Dear ${guest.guestName},`,
      `Your booking has been confirmed. Here are your details:`,
      ``,
      `📋 *Bill No:* ${guest.billNumber}`,
      `🏨 *Room:* ${guest.roomNumber}${(guest as { acType?: string }).acType ? ` (${(guest as { acType?: string }).acType})` : ""}`,
      `📅 *Check-In:* ${checkIn}`,
      `📅 *Check-Out:* ${checkOut}`,
      `🌙 *Nights:* ${nights}`,
      `💰 *Total:* ₹${grossTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      `✅ *Advance Paid:* ₹${advancePaid.toLocaleString()} (${guest.paymentMode || "Cash"})`,
      `🔴 *Balance Due:* ₹${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      ``,
      `Thank you for choosing us! 🙏`,
    ].join("\n");
    const url = `https://wa.me/${intlMobile}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

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
          <div className="flex flex-wrap gap-3 justify-end">
            <Button onClick={handleWhatsApp} variant="outline" className="gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950" size="lg">
              <MessageCircle className="w-4 h-4" /> Send via WhatsApp
            </Button>
            <Button onClick={handlePrint} className="gap-2" size="lg">
              <Printer className="w-4 h-4" /> Print 2 Copies
            </Button>
          </div>

          <div className="text-sm text-muted-foreground text-right">
            Prints <strong>Guest Copy</strong> + <strong>Hotel Copy</strong> on separate pages
          </div>

          <div
            ref={printRef}
            className="bill"
            style={{ maxWidth: 700, margin: "0 auto", padding: 20, border: "2px solid #1E3A8A", fontFamily: "Arial, sans-serif", fontSize: 13, color: "#000", background: "#fff" }}
          >
            <div style={{ textAlign: "right", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: "bold", color: "#1E3A8A", background: "#e8f0fe", border: "1px solid #1E3A8A", padding: "2px 10px", borderRadius: 4, letterSpacing: 1 }}>PREVIEW</span>
            </div>
            <div style={{ textAlign: "center", borderBottom: "2px solid #1E3A8A", paddingBottom: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 22, fontWeight: "bold", color: "#1E3A8A" }}>{settings?.hotelName || "Vaishnavi Residency"}</div>
              {settings?.tagline && <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{settings.tagline}</div>}
              {settings?.address && <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{settings.address}</div>}
              <div style={{ fontSize: 11, color: "#666" }}>
                {settings?.phone && `Ph: ${settings.phone}`}
                {settings?.phone && settings?.email && " | "}
                {settings?.email && `Email: ${settings.email}`}
              </div>
              {settings?.gstin && <div style={{ fontSize: 11, color: "#666" }}>GSTIN: {settings.gstin}</div>}
              <div style={{ fontSize: 15, fontWeight: "bold", letterSpacing: 2, marginTop: 10, color: "#1E3A8A", border: "1px solid #1E3A8A", display: "inline-block", padding: "3px 14px" }}>
                TAX INVOICE
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14, padding: 10, background: "#f8faff", border: "1px solid #dce4f5", borderRadius: 4 }}>
              {([
                ["Guest Name", guest.guestName],
                ["Bill Number", guest.billNumber],
                ["Mobile", guest.mobile],
                ["Room No.", `Room ${guest.roomNumber}`],
                ["AC Type", (guest as { acType?: string }).acType || "—"],
                ["Check-In", safeFormat(guest.checkInDate, "dd MMM yyyy")],
                ["Check-Out", safeFormat(checkOutDate, "dd MMM yyyy")],
                ["Payment Mode", guest.paymentMode || "Cash"],
                ...(guest.idProofType ? [["ID Type", guest.idProofType]] : []),
                ...(guest.aadhaarNumber ? [["ID Number", guest.aadhaarNumber]] : []),
              ] as [string, string][]).map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                  <div style={{ fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
              <thead>
                <tr>
                  {["Description", "Nights", "Rate/Day", "Amount"].map((h, i) => (
                    <th key={h} style={{ background: "#1E3A8A", color: "white", padding: "7px 9px", textAlign: i > 0 ? "right" as const : "left" as const, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid #e5e7eb" }}>
                    Room {guest.roomNumber} Accommodation<br />
                    <span style={{ fontSize: 11, color: "#666" }}>
                      {safeFormat(guest.checkInDate, "dd MMM")} to {safeFormat(checkOutDate, "dd MMM yyyy")}
                    </span>
                  </td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>{nights}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>₹{rentPerDay.toLocaleString()}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid #e5e7eb", textAlign: "right" }}>₹{roomCharge.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginLeft: "auto", width: 280 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr><td style={{ padding: "5px 9px", color: "#555" }}>Sub Total</td><td style={{ padding: "5px 9px", textAlign: "right" }}>₹{roomCharge.toLocaleString()}</td></tr>
                  {(guest.extraCharges || 0) > 0 && (
                    <tr><td style={{ padding: "5px 9px", color: "#555" }}>Extra Charges</td><td style={{ padding: "5px 9px", textAlign: "right" }}>₹{parseFloat(String(guest.extraCharges)).toLocaleString()}</td></tr>
                  )}
                  {(guest.discount || 0) > 0 && (
                    <tr><td style={{ padding: "5px 9px", color: "#059669" }}>Discount</td><td style={{ padding: "5px 9px", textAlign: "right", color: "#059669" }}>- ₹{parseFloat(String(guest.discount)).toLocaleString()}</td></tr>
                  )}
                  {settings?.taxEnabled && (
                    <tr><td style={{ padding: "5px 9px", color: "#555" }}>GST ({settings.taxRate}%)</td><td style={{ padding: "5px 9px", textAlign: "right" }}>₹{taxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td></tr>
                  )}
                  <tr style={{ fontWeight: "bold", fontSize: 13, borderTop: "2px solid #1E3A8A" }}>
                    <td style={{ padding: "7px 9px" }}>Grand Total</td>
                    <td style={{ padding: "7px 9px", textAlign: "right", color: "#1E3A8A" }}>₹{grossTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr><td style={{ padding: "5px 9px", color: "#059669" }}>Advance Paid ({guest.paymentMode || "Cash"})</td><td style={{ padding: "5px 9px", textAlign: "right", color: "#059669" }}>- ₹{advancePaid.toLocaleString()}</td></tr>
                  <tr style={{ fontWeight: "bold", fontSize: 14, borderTop: "2px solid #dc2626", color: "#dc2626" }}>
                    <td style={{ padding: "7px 9px" }}>Balance Due</td>
                    <td style={{ padding: "7px 9px", textAlign: "right" }}>₹{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <div><div style={{ borderTop: "1px solid #000", paddingTop: 4, width: 160, textAlign: "center" }}>Guest Signature</div></div>
              <div style={{ textAlign: "right" }}>
                <div style={{ marginBottom: 28 }}>For {settings?.hotelName || "Vaishnavi Residency"}</div>
                <div style={{ borderTop: "1px solid #000", paddingTop: 4, width: 160, textAlign: "center" }}>Authorized Signatory</div>
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: "#666", borderTop: "1px dashed #ccc", paddingTop: 10 }}>
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
