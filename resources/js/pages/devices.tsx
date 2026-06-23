import { useEffect, useState } from "react";
import api from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Laptop, Smartphone, Monitor, Trash2, Loader2 } from "lucide-react";

interface Device {
  id: number;
  device_name: string;
  device_type: string;
  ip_address: string;
  user_agent: string;
  last_activity_at: string;
  created_at: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const fetchDevices = async () => {
    try {
      const response = await api.get("/devices");
      setDevices(response.data.devices);
    } catch {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const revokeDevice = async (deviceId: number) => {
    setRevokingId(deviceId);
    try {
      await api.delete(`/devices/${deviceId}`);
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    } catch {
      // Handle error silently
    } finally {
      setRevokingId(null);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="size-5" />;
      case "desktop":
        return <Monitor className="size-5" />;
      default:
        return <Laptop className="size-5" />;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Devices</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage devices that have access to your account</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : devices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No active sessions found.</p>
              ) : (
                <div className="space-y-4">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                          {getDeviceIcon(device.device_type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{device.device_name || "Unknown Device"}</p>
                          <p className="text-xs text-muted-foreground">
                            IP: {device.ip_address} &middot; Last active:{" "}
                            {device.last_activity_at
                              ? new Date(device.last_activity_at).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => revokeDevice(device.id)}
                        disabled={revokingId === device.id}
                      >
                        {revokingId === device.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
