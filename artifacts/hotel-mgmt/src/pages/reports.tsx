import { useState, useMemo } from "react";
import { useGetRevenueReport, useGetOccupancyReport, useGetGuests } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, BedDouble, Users, Calendar, IndianRupee } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";

type Period = "today" | "week" | "month" | "year";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Reports() {
  const [period, setPeriod] = useState<Period>("week");
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  const { data: revenueData, isLoading: revenueLoading } = useGetRevenueReport({ period });
  const { data: occupancyData, isLoading: occLoading } = useGetOccupancyReport({ period });
  const { data: guests, isLoading: guestLoading } = useGetGuests();

  const totalRevenue = revenueData?.totalRevenue || 0;
  const avgOccupancy = occupancyData?.occupancyRate || 0;

  const guestSummary = {
    totalGuests: guests?.length || 0,
    checkedIn: guests?.filter(g => g.status === "checked-in").length || 0,
    checkedOut: guests?.filter(g => g.status === "checked-out").length || 0,
    booked: guests?.filter(g => g.status === "booked").length || 0,
  };

  const availableYears = useMemo(() => {
    if (!guests?.length) return [new Date().getFullYear()];
    const years = new Set(guests.map(g => new Date(g.createdAt || "").getFullYear()).filter(y => !isNaN(y)));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [guests]);

  const monthlyReport = useMemo(() => {
    return MONTH_NAMES.map((monthName, monthIdx) => {
      const monthGuests = (guests || []).filter(g => {
        const d = new Date(g.createdAt || "");
        return !isNaN(d.getTime()) && d.getFullYear() === reportYear && d.getMonth() === monthIdx;
      });
      const revenue = monthGuests.reduce((s, g) => s + (parseFloat(String(g.totalAmount)) || 0), 0);
      const advance = monthGuests.reduce((s, g) => s + (parseFloat(String(g.advancePaid)) || 0), 0);
      const balance = monthGuests.reduce((s, g) => s + (parseFloat(String(g.balanceAmount)) || 0), 0);
      const checkedOut = monthGuests.filter(g => g.status === "checked-out").length;
      return {
        month: monthName,
        shortMonth: SHORT_MONTH[monthIdx],
        monthIdx,
        guests: monthGuests.length,
        checkedOut,
        revenue,
        advance,
        balance,
      };
    });
  }, [guests, reportYear]);

  const yearTotal = useMemo(() => ({
    revenue: monthlyReport.reduce((s, m) => s + m.revenue, 0),
    guests: monthlyReport.reduce((s, m) => s + m.guests, 0),
    advance: monthlyReport.reduce((s, m) => s + m.advance, 0),
    balance: monthlyReport.reduce((s, m) => s + m.balance, 0),
  }), [monthlyReport]);

  const currentMonth = new Date().getMonth();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        </div>
        <Select value={period} onValueChange={v => setPeriod(v as Period)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-primary">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <BedDouble className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Occupancy Rate</p>
              <p className="text-2xl font-bold">{avgOccupancy.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Users className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Guests</p>
              <p className="text-2xl font-bold">{guestSummary.totalGuests}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            {revenueLoading ? <Skeleton className="h-[280px] w-full" /> : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData?.data || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Occupancy Rate</CardTitle></CardHeader>
          <CardContent>
            {occLoading ? <Skeleton className="h-[280px] w-full" /> : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={occupancyData?.data || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      formatter={(v: number) => [`${v.toFixed(1)}%`, "Occupancy"]}
                    />
                    <Line type="monotone" dataKey="occupancyRate" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Guest Summary</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {guestLoading ? (
              Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
            ) : (
              [
                { label: "Total Guests", value: guestSummary.totalGuests },
                { label: "Checked In", value: guestSummary.checkedIn },
                { label: "Checked Out", value: guestSummary.checkedOut },
                { label: "Booked", value: guestSummary.booked },
              ].map(s => (
                <div key={s.label} className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-primary">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Report */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <CardTitle>Monthly Report</CardTitle>
            </div>
            <Select value={String(reportYear)} onValueChange={v => setReportYear(parseInt(v))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableYears.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bar chart for monthly revenue */}
          {guestLoading ? <Skeleton className="h-[200px] w-full" /> : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyReport} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="shortMonth" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]}
                    labelFormatter={label => `${label} ${reportYear}`}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}
                    fill="hsl(var(--primary))"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold">Month</th>
                  <th className="px-4 py-3 text-right font-semibold">Guests</th>
                  <th className="px-4 py-3 text-right font-semibold">Check-Outs</th>
                  <th className="px-4 py-3 text-right font-semibold text-primary">Revenue</th>
                  <th className="px-4 py-3 text-right font-semibold text-green-600">Advance</th>
                  <th className="px-4 py-3 text-right font-semibold text-red-500">Balance</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReport.map((row) => {
                  const isCurrent = row.monthIdx === currentMonth && reportYear === new Date().getFullYear();
                  return (
                    <tr
                      key={row.month}
                      className={`border-b border-border transition-colors ${
                        isCurrent
                          ? "bg-primary/5 dark:bg-primary/10"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-primary inline-block" title="Current month" />
                        )}
                        {row.month}
                        {isCurrent && <span className="text-xs text-primary font-semibold ml-1">(Current)</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.guests || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.checkedOut || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-primary">
                        {row.revenue > 0 ? `₹${row.revenue.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-green-600">
                        {row.advance > 0 ? `₹${row.advance.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-red-500">
                        {row.balance > 0 ? `₹${row.balance.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/80 font-bold border-t-2 border-border">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-primary" />
                    Total {reportYear}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{yearTotal.guests || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">—</td>
                  <td className="px-4 py-3 text-right tabular-nums text-primary">₹{yearTotal.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-green-600">₹{yearTotal.advance.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-red-500">₹{yearTotal.balance.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
