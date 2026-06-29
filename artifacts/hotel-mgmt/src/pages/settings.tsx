import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings2, Save } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { data: settings, isLoading, refetch } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const [form, setForm] = useState({
    hotelName: "", tagline: "", address: "", phone: "", email: "",
    website: "", gstin: "", checkInTime: "12:00", checkOutTime: "11:00",
    taxEnabled: false, taxRate: "18", currency: "INR",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        hotelName: settings.hotelName || "",
        tagline: settings.tagline || "",
        address: settings.address || "",
        phone: settings.phone || "",
        email: settings.email || "",
        website: settings.website || "",
        gstin: settings.gstin || "",
        checkInTime: settings.checkInTime || "12:00",
        checkOutTime: settings.checkOutTime || "11:00",
        taxEnabled: settings.taxEnabled || false,
        taxRate: String(settings.taxRate || "18"),
        currency: settings.currency || "INR",
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(
      {
        data: {
          hotelName: form.hotelName,
          tagline: form.tagline || undefined,
          address: form.address || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          website: form.website || undefined,
          gstin: form.gstin || undefined,
          checkInTime: form.checkInTime,
          checkOutTime: form.checkOutTime,
          taxEnabled: form.taxEnabled,
          taxRate: parseFloat(form.taxRate) || 0,
          currency: form.currency,
        },
      },
      {
        onSuccess: () => { toast.success("Settings saved successfully"); refetch(); },
        onError: () => toast.error("Failed to save settings"),
      }
    );
  };

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings2 className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending} className="gap-2">
          <Save className="w-4 h-4" />
          {updateSettings.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Hotel Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Hotel Name *</Label>
            <Input value={form.hotelName} onChange={e => setForm(f => ({ ...f, hotelName: e.target.value }))} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} className="h-11" placeholder="Your Home Away From Home" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="h-11" placeholder="Full hotel address" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="h-11" placeholder="www.example.com" />
          </div>
          <div className="space-y-2">
            <Label>GSTIN</Label>
            <Input value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} className="h-11" placeholder="GST number" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Check-In / Check-Out</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Default Check-In Time</Label>
            <Input type="time" value={form.checkInTime} onChange={e => setForm(f => ({ ...f, checkInTime: e.target.value }))} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Default Check-Out Time</Label>
            <Input type="time" value={form.checkOutTime} onChange={e => setForm(f => ({ ...f, checkOutTime: e.target.value }))} className="h-11" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Billing & Tax</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Enable GST</p>
              <p className="text-sm text-muted-foreground">Apply GST to all bills</p>
            </div>
            <Switch
              checked={form.taxEnabled}
              onCheckedChange={v => setForm(f => ({ ...f, taxEnabled: v }))}
            />
          </div>
          {form.taxEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input type="number" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} className="h-11" min="0" max="100" />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="h-11" placeholder="INR" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSettings.isPending} size="lg" className="gap-2">
          <Save className="w-4 h-4" />
          {updateSettings.isPending ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}
