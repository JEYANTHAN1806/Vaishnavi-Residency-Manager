import {
  useGetDashboardStats,
  useGetRecentGuests,
  useGetUpcomingReservations,
  useGetRevenueReport,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, LogOut, BedDouble, Key, IndianRupee, Wallet, TrendingUp, CalendarRange
} from "lucide-react";
import { format } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentGuests, isLoading: guestsLoading } = useGetRecentGuests();
  const { data: upcomingReservations, isLoading: reservationsLoading } = useGetUpcomingReservations();
  const { data: revenueData, isLoading: revenueLoading } = useGetRevenueReport({ period: "week" });

  const statCards = [
    { title: "Today's Check-ins", value: stats?.todayCheckIns, icon: Users, color: "text-blue-500" },
    { title: "Today's Check-outs", value: stats?.todayCheckOuts, icon: LogOut, color: "text-orange-500" },
    { title: "Occupied Rooms", value: stats?.occupiedRooms, icon: BedDouble, color: "text-red-500" },
    { title: "Available Rooms", value: stats?.availableRooms, icon: Key, color: "text-green-500" },
    { title: "Reserved Rooms", value: stats?.reservedRooms, icon: CalendarRange, color: "text-yellow-500" },
    { title: "Today's Revenue", value: `₹${stats?.todayRevenue || 0}`, icon: IndianRupee, color: "text-accent" },
    { title: "Pending Balance", value: `₹${stats?.pendingBalance || 0}`, icon: Wallet, color: "text-red-500" },
    { title: "Monthly Revenue", value: `₹${stats?.monthlyRevenue || 0}`, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <div className="text-sm text-muted-foreground font-medium bg-muted px-4 py-2 rounded-lg">
          {format(new Date(), "EEEE, do MMMM yyyy")}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : statCards.map((stat, i) => (
            <Card key={i} className="shadow-sm border-border hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                </div>
                <div className={`p-3 bg-muted rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader>
            <CardTitle>Revenue (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="w-full h-[300px]" />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData?.data || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-sm border-border flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              {guestsLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : recentGuests?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">No recent guests</div>
              ) : (
                <div className="space-y-4">
                  {recentGuests?.slice(0, 5).map(guest => (
                    <div key={guest.id} className="flex justify-between items-center border-b border-border last:border-0 pb-3 last:pb-0">
                      <div>
                        <p className="font-medium text-sm text-foreground">{guest.guestName}</p>
                        <p className="text-xs text-muted-foreground">Room {guest.roomNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-foreground">₹{guest.totalAmount}</p>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {guest.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Upcoming Reservations</CardTitle>
            </CardHeader>
            <CardContent>
              {reservationsLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : upcomingReservations?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">No upcoming reservations</div>
              ) : (
                <div className="space-y-4">
                  {upcomingReservations?.slice(0, 4).map(res => (
                    <div key={res.id} className="flex justify-between items-center border-b border-border last:border-0 pb-3 last:pb-0">
                      <div>
                        <p className="font-medium text-sm text-foreground">{res.guestName}</p>
                        <p className="text-xs text-muted-foreground">{res.checkInDate ? format(new Date(res.checkInDate), "MMM dd") : "?"} - Room {res.roomNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-foreground">Adv: ₹{res.advance || 0}</p>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          {res.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}