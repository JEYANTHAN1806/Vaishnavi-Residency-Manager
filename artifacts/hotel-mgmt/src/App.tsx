import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NewGuest from "@/pages/guests/new";
import GuestsList from "@/pages/guests/index";
import GuestDetail from "@/pages/guests/detail";
import CheckIn from "@/pages/checkin";
import CheckOut from "@/pages/checkout";
import Rooms from "@/pages/rooms";
import Reservations from "@/pages/reservations";
import Payments from "@/pages/payments";
import PrintBills from "@/pages/print-bills";
import GuestHistory from "@/pages/guest-history";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/guests/new" component={NewGuest} />
        <Route path="/guests/:id" component={GuestDetail} />
        <Route path="/guests" component={GuestsList} />
        <Route path="/checkin" component={CheckIn} />
        <Route path="/checkout" component={CheckOut} />
        <Route path="/rooms" component={Rooms} />
        <Route path="/reservations" component={Reservations} />
        <Route path="/payments" component={Payments} />
        <Route path="/print-bills" component={PrintBills} />
        <Route path="/guest-history" component={GuestHistory} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route path="/">
          {() => {
            window.location.href = "/dashboard";
            return null;
          }}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
