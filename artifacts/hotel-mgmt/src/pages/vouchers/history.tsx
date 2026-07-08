import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  useGetVouchers,
  useDeleteVoucher,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, Printer, Download, Trash2, CreditCard as Edit, Copy, IndianRupee, Receipt, Wallet } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { exportToCSV, exportToExcel } from "@/lib/voucher-utils";
import { printVoucher, type VoucherPrintData } from "@/components/VoucherPrint";

export default function VoucherHistory() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: vouchers, isLoading, refetch } = useGetVouchers();
  const deleteVoucher = useDeleteVoucher();

  const filtered = useMemo(() => {
    return vouchers?.filter((v) => {
      const matchSearch = !search ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
        v.reason.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || v.type === typeFilter;
      const matchFrom = !fromDate || v.date >= fromDate;
      const matchTo = !toDate || v.date <= toDate;
      return matchSearch && matchType && matchFrom && matchTo;
    }) || [];
  }, [vouchers, search, typeFilter, fromDate, toDate]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayVouchers = filtered.filter((v) => v.date === today);
    const totalAmount = filtered.reduce((s, v) => s + v.amount, 0);
    const todayAmount = todayVouchers.reduce((s, v) => s + v.amount, 0);
    const paymentTotal = filtered.filter((v) => v.type === "payment").reduce((s, v) => s + v.amount, 0);
    const receiptTotal = filtered.filter((v) => v.type === "receipt").reduce((s, v) => s + v.amount, 0);
    return {
      total: filtered.length,
      todayCount: todayVouchers.length,
      todayAmount,
      totalAmount,
      paymentTotal,
      receiptTotal,
    };
  }, [filtered]);

  const handlePrint = (v: NonNullable<typeof vouchers>[number]) => {
    const printData: VoucherPrintData = {
      voucherNumber: v.voucherNumber,
      type: v.type as "payment" | "receipt",
      name: v.name,
      reason: v.reason,
      amount: v.amount,
      amountInWords: v.amountInWords ?? null,
      date: v.date,
      approvedBy: v.approvedBy ?? null,
      receivedBy: v.receivedBy ?? null,
      remarks: v.remarks ?? null,
    };
    printVoucher(printData);
  };

  const handleExportCSV = () => {
    const headers = ["Voucher No", "Type", "Name", "Reason", "Amount", "Date", "Approved By", "Received By", "Remarks"];
    const rows = filtered.map((v) => [
      v.voucherNumber, v.type, v.name, v.reason, v.amount, v.date,
      v.approvedBy || "", v.receivedBy || "", v.remarks || "",
    ]);
    exportToCSV(`vouchers-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    toast.success("CSV exported");
  };

  const handleExportExcel = () => {
    const headers = ["Voucher No", "Type", "Name", "Reason", "Amount", "Date", "Approved By", "Received By", "Remarks"];
    const rows = filtered.map((v) => [
      v.voucherNumber, v.type, v.name, v.reason, v.amount, v.date,
      v.approvedBy || "", v.receivedBy || "", v.remarks || "",
    ]);
    exportToExcel(`vouchers-${new Date().toISOString().slice(0, 10)}.xls`, headers, rows);
    toast.success("Excel exported");
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteVoucher.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          toast.success("Voucher deleted");
          setDeleteId(null);
          refetch();
        },
        onError: () => toast.error("Failed to delete voucher"),
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Voucher History</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} size="sm" className="gap-2">
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel} size="sm" className="gap-2">
            <Download className="w-4 h-4" /> Excel
          </Button>
          <Button onClick={() => setLocation("/vouchers/new")} className="gap-2">
            <Plus className="w-4 h-4" /> New Voucher
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Vouchers</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
            <div className="p-2.5 bg-muted rounded-full text-primary">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Today's Vouchers</p>
              <h3 className="text-2xl font-bold">{stats.todayCount}</h3>
            </div>
            <div className="p-2.5 bg-muted rounded-full text-blue-500">
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Payment Total</p>
              <h3 className="text-xl font-bold text-orange-500">₹{stats.paymentTotal.toLocaleString("en-IN")}</h3>
            </div>
            <div className="p-2.5 bg-muted rounded-full text-orange-500">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Receipt Total</p>
              <h3 className="text-xl font-bold text-green-500">₹{stats.receiptTotal.toLocaleString("en-IN")}</h3>
            </div>
            <div className="p-2.5 bg-muted rounded-full text-green-500">
              <IndianRupee className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search vouchers..."
                className="pl-10 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-10"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1">
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No vouchers found</p>
              <p className="text-sm mt-1">Create a new voucher to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Voucher No", "Type", "Name", "Reason", "Amount", "Date", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => (
                    <tr key={v.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-primary">{v.voucherNumber}</td>
                      <td className="px-4 py-3">
                        <Badge variant={v.type === "payment" ? "default" : "secondary"}>
                          {v.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">{v.name}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{v.reason}</td>
                      <td className="px-4 py-3 font-semibold">₹{v.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {v.date ? format(new Date(v.date), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handlePrint(v)} title="Print">
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setLocation(`/vouchers/new?edit=${v.id}`)} title="Edit">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setLocation(`/vouchers/new?duplicate=${v.id}`)} title="Duplicate">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(v.id)} title="Delete" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Voucher?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The voucher will be permanently removed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteVoucher.isPending}>
              {deleteVoucher.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
