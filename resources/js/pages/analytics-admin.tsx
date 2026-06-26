import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Link2,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface AdminAnalytics {
  total_connections: number;
  active_connections: number;
  total_scheduled: number;
  total_published: number;
  total_failed: number;
  users_with_connections: number;
  top_accounts: Array<{
    name: string;
    provider: string;
    total_posts: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await api.get("/analytics/admin");
        setData(response.data.data);
      } catch {
        // handle error
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  if (!user || user.role !== "admin") {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full py-20 text-muted-foreground">
            Admin access required.
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
                  <BreadcrumbPage>Admin Analytics</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Analytics</h1>
            <p className="text-sm text-muted-foreground">Aggregated metrics across all users and accounts</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : !data ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
                <BarChart3 className="mb-3 size-12 opacity-50" />
                <p className="text-sm">Unable to load analytics.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Total Connections</p>
                      <Link2 className="size-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold mt-1">{data.total_connections}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {data.active_connections} active
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Users with Connections</p>
                      <Users className="size-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold mt-1">{data.users_with_connections}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Total Scheduled</p>
                      <Clock className="size-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold mt-1">{data.total_scheduled}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Published</p>
                      <CheckCircle2 className="size-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-1">{data.total_published}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Failed</p>
                      <XCircle className="size-4 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-600 mt-1">{data.total_failed}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                      <TrendingUp className="size-4 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      {data.total_scheduled > 0
                        ? `${Math.round((data.total_published / data.total_scheduled) * 100)}%`
                        : "—"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Top Accounts Bar Chart */}
              {data.top_accounts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Accounts by Post Volume</CardTitle>
                    <CardDescription>Accounts with the most scheduled posts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.top_accounts} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={140} />
                          <Tooltip
                            contentStyle={{
                              background: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="total_posts" fill="#6366f1" radius={[0, 4, 4, 0]} name="Total Posts" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
