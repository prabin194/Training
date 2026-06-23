import { useEffect, useState } from "react";
import api from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, History } from "lucide-react";

interface Activity {
  id: number;
  action: string;
  description: string;
  metadata: Record<string, unknown> | null;
  ip_address: string;
  created_at: string;
}

interface PaginatedResponse {
  data: Activity[];
  current_page: number;
  last_page: number;
  total: number;
}

const actionIcons: Record<string, string> = {
  register: "📝",
  email_verified: "✅",
  login: "🔑",
  logout: "🚪",
  password_changed: "🔒",
  profile_updated: "👤",
  device_revoked: "📱",
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async (page = 1) => {
    try {
      const response = await api.get(`/activity-logs?page=${page}`);
      setLogs(response.data);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

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
                  <BreadcrumbPage>Activity Logs</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="size-5" />
                <CardTitle>Activity Logs</CardTitle>
              </div>
              <CardDescription>Recent account activity and changes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : !logs || logs.data.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No activity recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {logs.data.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <span className="text-lg mt-0.5">
                        {actionIcons[activity.action] || "📋"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
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
