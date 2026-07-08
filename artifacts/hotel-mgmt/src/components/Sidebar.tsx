import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { LayoutDashboard, UserPlus, CalendarCheck, LogIn, LogOut, BedDouble, CreditCard, Printer, History, ChartBar as BarChart3, Settings2, Moon, Sun, Menu, X, FileText } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import { clearAuth } from "@/lib/auth";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/guests/new", label: "New Guest", icon: UserPlus },
  { href: "/guests", label: "Guests", icon: UserPlus },
  { href: "/reservations", label: "Reservations", icon: CalendarCheck },
  { href: "/checkin", label: "Check In", icon: LogIn },
  { href: "/checkout", label: "Check Out", icon: LogOut },
  { href: "/rooms", label: "Rooms", icon: BedDouble },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/vouchers/new", label: "New Voucher", icon: FileText },
  { href: "/vouchers/history", label: "Voucher History", icon: History },
  { href: "/print-bills", label: "Print Bills", icon: Printer },
  { href: "/guest-history", label: "Guest History", icon: History },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        clearAuth();
        setLocation("/login");
      }
    });
  };

  const navContent = (
    <>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent text-white flex items-center justify-center rounded-lg font-bold text-xl">
            VR
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sidebar-foreground">Vaishnavi</span>
            <span className="text-xs text-sidebar-foreground/70">Residency</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-sidebar-foreground"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/guests");
            const isExactGuests = item.href === "/guests" && location === "/guests";
            const actualIsActive = item.href === "/guests" ? isExactGuests : isActive;
            return (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    actualIsActive 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 mt-auto border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-sidebar-primary/20 text-sidebar-primary flex items-center justify-center rounded-full font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</div>
            <div className="text-xs text-sidebar-foreground/70 capitalize">{user?.role}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-sidebar text-sidebar-foreground p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent text-white flex items-center justify-center rounded-lg font-bold">VR</div>
          <span className="font-bold">Vaishnavi Residency</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-sidebar border-r border-sidebar-border shadow-lg">
        {navContent}
      </aside>

      {/* Sidebar - Mobile */}
      {mobileOpen && (
        <aside className="md:hidden fixed inset-0 z-50 bg-sidebar flex flex-col pt-16">
          {navContent}
        </aside>
      )}
    </>
  );
}