import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  CheckCheck,
  Loader2,
  BellRing,
  BellOff,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  FileText,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

interface PaginatedNotifications {
  data: NotificationItem[];
  current_page: number;
  last_page: number;
  total: number;
  unread_count: number;
}

const typeIcons: Record<string, React.ReactNode> = {
  schedule_published: <CheckCircle2 className="size-4 text-green-600" />,
  schedule_failed: <XCircle className="size-4 text-red-600" />,
  review_submitted: <Send className="size-4 text-blue-600" />,
  review_approved: <CheckCircle2 className="size-4 text-emerald-600" />,
  review_rejected: <XCircle className="size-4 text-orange-600" />,
  new_message: <MessageSquare className="size-4 text-violet-600" />,
};

const typeLabels: Record<string, string> = {
  schedule_published: "Publish Success",
  schedule_failed: "Publish Failed",
  review_submitted: "Review Request",
  review_approved: "Approved",
  review_rejected: "Rejected",
  new_message: "New Message",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<PaginatedNotifications | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data);
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await api.post("/notifications/mark-all-read");
      fetchNotifications();
    } catch {
      // handle error
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {
      // handle error
    }
  };

  const totalNotifications = notifications?.total ?? 0;
  const unreadCount = notifications?.unread_count ?? 0;

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
                  <BreadcrumbPage>Notifications</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                  : "All caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={isMarkingAll}>
                {isMarkingAll ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="mr-1.5 size-3.5" />
                )}
                Mark All Read
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                </div>
              ) : !notifications || notifications.data.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-muted-foreground">
                  <BellOff className="mb-3 size-12 opacity-50" />
                  <CardTitle className="text-lg mb-1">No notifications</CardTitle>
                  <CardDescription>
                    You'll see notifications here when posts are published, reviews are submitted, or messages arrive.
                  </CardDescription>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.data.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                        !n.read_at ? "bg-accent/30 border-primary/20" : ""
                      }`}
                      onClick={() => {
                        if (!n.read_at) handleMarkRead(n.id);
                      }}
                    >
                      <div className="mt-0.5 shrink-0">
                        {typeIcons[n.type] || <Bell className="size-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm truncate ${!n.read_at ? "font-semibold" : ""}`}>
                            {n.title}
                          </p>
                          {!n.read_at && (
                            <span className="size-1.5 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        {n.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {typeLabels[n.type] || n.type}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {!n.read_at && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(n.id);
                          }}
                        >
                          <CheckCheck className="size-3.5" />
                        </Button>
                      )}
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
