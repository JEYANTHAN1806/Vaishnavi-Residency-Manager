import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  useGetVouchers,
  useCreateVoucher,
  useUpdateVoucher,
  useGetNextVoucherNumberForType,
  useGetVoucher,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Save, Printer, RotateCcw, Copy, ArrowLeft, Eye, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { numberToWords, formatVoucherDate } from "@/lib/voucher-utils";
import { printVoucher, type VoucherPrintData } from "@/components/VoucherPrint";

const DRAFT_KEY = "voucher-draft";

export default function NewVoucher() {
  const [, setLocation] = useLocation();
  const [editId, setEditId] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [form, setForm] = useState({
    type: "payment" as "payment" | "receipt",
    name: "",
    reason: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    approvedBy: "",
    receivedBy: "",
    remarks: "",
  });

  const { data: nextNum } = useGetNextVoucherNumberForType({ type: form.type });
  const { data: vouchers } = useGetVouchers();
  const { data: editVoucher } = useGetVoucher(editId ?? -1, { query: { enabled: !!editId } as any });
  const createVoucher = useCreateVoucher();
  const updateVoucher = useUpdateVoucher();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const edit = params.get("edit");
    const dup = params.get("duplicate");
    if (edit) setEditId(parseInt(edit));
    if (dup) {
      const dupId = parseInt(dup);
      const v = vouchers?.find((x) => x.id === dupId);
      if (v) {
        setForm({
          type: v.type as "payment" | "receipt",
          name: v.name,
          reason: v.reason,
          amount: String(v.amount),
          date: v.date,
          approvedBy: v.approvedBy || "",
          receivedBy: v.receivedBy || "",
          remarks: v.remarks || "",
        });
        toast.info("Duplicated voucher details — new voucher number will be generated on save");
      }
    }
  }, [vouchers]);

  useEffect(() => {
    if (editVoucher && editId) {
      setForm({
        type: editVoucher.type as "payment" | "receipt",
        name: editVoucher.name,
        reason: editVoucher.reason,
        amount: String(editVoucher.amount),
        date: editVoucher.date,
        approvedBy: editVoucher.approvedBy || "",
        receivedBy: editVoucher.receivedBy || "",
        remarks: editVoucher.remarks || "",
      });
    }
  }, [editVoucher, editId]);

  // Auto-save draft
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved && !editId) {
      try {
        const draft = JSON.parse(saved);
        setForm((prev) => ({ ...prev, ...draft }));
        toast.info("Restored unsaved draft");
      } catch { /* ignore */ }
    }
  }, [editId]);

  useEffect(() => {
    if (!editId) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    }
  }, [form, editId]);

  const amountNum = parseFloat(form.amount) || 0;
  const amountInWords = amountNum > 0 ? numberToWords(amountNum) : "";

  const handleSave = useCallback(() => {
    if (!form.name || !form.reason || !form.amount) {
      toast.error("Please fill all required fields");
      return;
    }
    const payload = {
      type: form.type,
      name: form.name,
      reason: form.reason,
      amount: amountNum,
      amountInWords,
      date: form.date,
      approvedBy: form.type === "payment" ? form.approvedBy : form.receivedBy,
      receivedBy: form.type === "payment" ? form.receivedBy : form.receivedBy,
      remarks: form.remarks || undefined,
    };

    if (editId) {
      updateVoucher.mutate(
        { id: editId, data: payload },
        {
          onSuccess: (data) => {
            toast.success(`Voucher updated: ${data.voucherNumber}`);
            localStorage.removeItem(DRAFT_KEY);
            setLocation("/vouchers/history");
          },
          onError: () => toast.error("Failed to update voucher"),
        }
      );
    } else {
      createVoucher.mutate(
        { data: payload },
        {
          onSuccess: (data) => {
            toast.success(`Voucher created: ${data.voucherNumber}`);
            localStorage.removeItem(DRAFT_KEY);
            setLocation("/vouchers/history");
          },
          onError: () => toast.error("Failed to create voucher"),
        }
      );
    }
  }, [form, amountNum, amountInWords, editId, createVoucher, updateVoucher, setLocation]);

  const handlePrint = useCallback(() => {
    if (!form.name || !form.reason || !form.amount) {
      toast.error("Please fill all required fields before printing");
      return;
    }
    const printData: VoucherPrintData = {
      voucherNumber: editVoucher?.voucherNumber || nextNum?.voucherNumber || "PV-000000",
      type: form.type,
      name: form.name,
      reason: form.reason,
      amount: amountNum,
      amountInWords,
      date: form.date,
      approvedBy: form.approvedBy || null,
      receivedBy: form.receivedBy || null,
      remarks: form.remarks || null,
    };
    printVoucher(printData);
  }, [form, amountNum, amountInWords, editVoucher, nextNum]);

  const handleReset = () => {
    setForm({
      type: "payment" as "payment" | "receipt",
      name: "",
      reason: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      approvedBy: "",
      receivedBy: "",
      remarks: "",
    });
    localStorage.removeItem(DRAFT_KEY);
    toast.info("Form reset");
  };

  const handleCopyPrevious = () => {
    const prev = vouchers?.[0];
    if (!prev) {
      toast.error("No previous vouchers found");
      return;
    }
    setForm((f) => ({
      ...f,
      type: prev.type as "payment" | "receipt",
      name: prev.name,
      reason: prev.reason,
      approvedBy: prev.approvedBy || "",
      receivedBy: prev.receivedBy || "",
    }));
    toast.info("Copied details from previous voucher");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        handlePrint();
      }
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, handlePrint]);

  const previewData: VoucherPrintData = {
    voucherNumber: editVoucher?.voucherNumber || nextNum?.voucherNumber || "PV-000000",
    type: form.type,
    name: form.name || "—",
    reason: form.reason || "—",
    amount: amountNum,
    amountInWords,
    date: form.date,
    approvedBy: form.approvedBy || null,
    receivedBy: form.receivedBy || null,
    remarks: form.remarks || null,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/vouchers/history")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            {editId ? "Edit Voucher" : "New Voucher"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(true)}>
            <Keyboard className="w-4 h-4" /> Shortcuts
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voucher Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Voucher Type *</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v as "payment" | "receipt" }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">Payment Voucher (PV)</SelectItem>
                      <SelectItem value="receipt">Receipt Voucher (RV)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Voucher Number</Label>
                  <Input
                    value={editVoucher?.voucherNumber || nextNum?.voucherNumber || "—"}
                    disabled
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{form.type === "payment" ? "Paid To *" : "Received From *"}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Enter name"
                />
              </div>

              <div className="space-y-2">
                <Label>Reason / Description *</Label>
                <Input
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="Enter reason"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (₹) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount in Words</Label>
                <div className="p-3 bg-muted rounded-lg text-sm font-medium min-h-[44px]">
                  {amountInWords || "—"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Approved By</Label>
                  <Input
                    value={form.approvedBy}
                    onChange={(e) => setForm((f) => ({ ...f, approvedBy: e.target.value }))}
                    placeholder="Approver name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Received By</Label>
                  <Input
                    value={form.receivedBy}
                    onChange={(e) => setForm((f) => ({ ...f, receivedBy: e.target.value }))}
                    placeholder="Receiver name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={form.remarks}
                  onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                  placeholder="Additional remarks (optional)"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={createVoucher.isPending || updateVoucher.isPending} className="gap-2">
              <Save className="w-4 h-4" />
              {editId ? "Update" : "Save"} Voucher
              <span className="text-xs opacity-60 ml-1">Ctrl+S</span>
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" /> Print
              <span className="text-xs opacity-60 ml-1">Ctrl+P</span>
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-2">
              <Eye className="w-4 h-4" /> Preview
            </Button>
            <Button variant="outline" onClick={handleCopyPrevious} className="gap-2">
              <Copy className="w-4 h-4" /> Copy Previous
            </Button>
            <Button variant="ghost" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" /> Reset
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voucher Type</span>
                <Badge variant={form.type === "payment" ? "default" : "secondary"}>
                  {form.type === "payment" ? "Payment" : "Receipt"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number</span>
                <span className="font-mono text-xs">
                  {editVoucher?.voucherNumber || nextNum?.voucherNumber || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{formatVoucherDate(form.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">₹{amountNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2">
                <span className="text-muted-foreground text-xs">Draft auto-saved</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Voucher Preview</DialogTitle>
          </DialogHeader>
          <div className="bg-white text-black rounded-lg overflow-hidden border">
            <div className="p-6 border-b-2 border-gray-300">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">Vaishnavi Residency</h2>
                <p className="text-sm font-semibold uppercase">
                  {form.type === "payment" ? "Payment Voucher" : "Receipt Voucher"}
                </p>
                <p className="text-xs text-gray-500 uppercase">Original — Office Copy</p>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span><strong>Voucher No:</strong> {previewData.voucherNumber}</span>
                <span><strong>Date:</strong> {formatVoucherDate(previewData.date)}</span>
              </div>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr><td className="border border-gray-300 p-2 font-semibold bg-gray-50 w-1/3">{form.type === "payment" ? "Paid To" : "Received From"}</td><td className="border border-gray-300 p-2">{previewData.name}</td></tr>
                  <tr><td className="border border-gray-300 p-2 font-semibold bg-gray-50">Reason</td><td className="border border-gray-300 p-2">{previewData.reason}</td></tr>
                  <tr><td className="border border-gray-300 p-2 font-semibold bg-gray-50">Amount (figures)</td><td className="border border-gray-300 p-2">₹ {previewData.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td className="border border-gray-300 p-2 font-semibold bg-gray-50">Amount (words)</td><td className="border border-gray-300 p-2">{previewData.amountInWords || "—"}</td></tr>
                  {previewData.remarks && <tr><td className="border border-gray-300 p-2 font-semibold bg-gray-50">Remarks</td><td className="border border-gray-300 p-2">{previewData.remarks}</td></tr>}
                </tbody>
              </table>
              <div className="flex justify-between mt-8">
                <div className="text-center w-32"><div className="border-t border-gray-400 pt-1 text-xs font-semibold">{form.type === "payment" ? "Approved By" : "Received By"}</div></div>
                <div className="text-center w-32"><div className="border-t border-gray-400 pt-1 text-xs font-semibold">{form.type === "payment" ? "Received By" : "Authorized By"}</div></div>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">Vaishnavi Residency</h2>
                <p className="text-sm font-semibold uppercase">
                  {form.type === "payment" ? "Payment Voucher" : "Receipt Voucher"}
                </p>
                <p className="text-xs text-gray-500 uppercase">Duplicate — Party Copy</p>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span><strong>Voucher No:</strong> {previewData.voucherNumber}</span>
                <span><strong>Date:</strong> {formatVoucherDate(previewData.date)}</span>
              </div>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr><td className="border border-gray-300 p-2 font-semibold bg-gray-50 w-1/3">{form.type === "payment" ? "Paid To" : "Received From"}</td><td className="border border-gray-300 p-2">{previewData.name}</td></tr>
                  <tr><td className="border border-gray-300 p-2 font-semibold bg-gray-50">Reason</td><td className="border border-gray-300 p-2">{previewData.reason}</td></tr>
                  <tr><td className="border border-gray-300 p-2 font-semibold bg-gray-50">Amount (figures)</td><td className="border border-gray-300 p-2">₹ {previewData.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td className="border border-gray-300 p-2 font-semibold bg-gray-50">Amount (words)</td><td className="border border-gray-300 p-2">{previewData.amountInWords || "—"}</td></tr>
                </tbody>
              </table>
              <div className="flex justify-between mt-8">
                <div className="text-center w-32"><div className="border-t border-gray-400 pt-1 text-xs font-semibold">{form.type === "payment" ? "Approved By" : "Received By"}</div></div>
                <div className="text-center w-32"><div className="border-t border-gray-400 pt-1 text-xs font-semibold">{form.type === "payment" ? "Received By" : "Authorized By"}</div></div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>Close</Button>
            <Button onClick={handlePrint} className="gap-2"><Printer className="w-4 h-4" /> Print</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent>
          <DialogHeader><DialogTitle>Keyboard Shortcuts</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Save voucher</span><kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + S</kbd></div>
            <div className="flex justify-between"><span>Print voucher</span><kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + P</kbd></div>
            <div className="flex justify-between"><span>Show shortcuts</span><kbd className="px-2 py-1 bg-muted rounded text-xs">Shift + ?</kbd></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
