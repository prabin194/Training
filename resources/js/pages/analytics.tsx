import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Users,
  Eye,
  MessageSquare,
  Download,
  AlertCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "@/lib/api";

interface TimelinePoint {
  date: string;
  value: number;
}

interface AccountMetrics {
  connection_id: number;
  name: string;
  platform: "facebook" | "instagram";
  is_expired: boolean;
  data: {
    error: string | null;
    followers: number | null;
    page_likes?: number | null;
    total_engagement?: number | null;
    total_impressions?: number | null;
    total_reach: number | null;
    total_views?: number | null;
    total_profile_taps?: number | null;
    engagement_timeline?: TimelinePoint[];
    impressions_timeline?: TimelinePoint[];
    reach_timeline?: TimelinePoint[];
    views_timeline?: TimelinePoint[];
    profile_taps_timeline?: TimelinePoint[];
  };
}

interface Aggregated {
  total_followers: number;
  total_engagement: number;
  total_impressions: number;
  total_reach: number;
  total_views: number;
  accounts_with_errors: number;
}

interface PublishingStats {
  total_scheduled: number;
  total_published: number;
  total_failed: number;
  by_platform: {
    facebook: number;
    instagram: number;
  };
}

interface AnalyticsResponse {
  metrics: AccountMetrics[];
  aggregated: Aggregated;
  publishing_stats: PublishingStats;
  cached_at: string;
  days: number;
}

const COLORS = ["#6366f1", "#f59e0b", "#22c55e", "#ef4444", "#8b5cf6", "#ec4899"];

function FacebookIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  );
}

function InstagramIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [days, setDays] = useState(28);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [timeSinceUpdate, setTimeSinceUpdate] = useState("");

  const fetchAnalytics = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const params: Record<string, string | number | boolean> = { days };
      if (selectedPlatform) params.platform = selectedPlatform;
      if (refreshing) params.refresh = true;

      const response = await api.get("/analytics", { params });
      setData(response.data);
      setTimeSinceUpdate(formatTimeSince(response.data.cached_at));
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [days, selectedPlatform]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Separate timer for "last updated" display
  useEffect(() => {
    if (!data?.cached_at) return;
    const update = () => setTimeSinceUpdate(formatTimeSince(data.cached_at));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [data?.cached_at]);

  function formatTimeSince(cachedAt: string): string {
    const diff = Math.floor((Date.now() - new Date(cachedAt).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  const handleExport = async () => {
    try {
      const params: Record<string, string | number> = { days };
      if (selectedPlatform) params.platform = selectedPlatform;

      const response = await api.get("/analytics/export", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // handle error
    }
  };

  // Build timeline chart data (aggregate reach/views across accounts)
  const timelineData = data?.metrics.reduce<Record<string, { date: string; reach: number; facebook_reach: number; instagram_reach: number }>>((acc, m) => {
    const timeline = m.data.reach_timeline || m.data.views_timeline || [];
    const platform = m.platform;

    timeline.forEach((point) => {
      if (!point.date) return;
      const key = point.date.slice(0, 10);
      if (!acc[key]) acc[key] = { date: key, reach: 0, facebook_reach: 0, instagram_reach: 0 };
      acc[key].reach += point.value;
      if (platform === "facebook") acc[key].facebook_reach += point.value;
      else acc[key].instagram_reach += point.value;
    });

    return acc;
  }, {});
  const timelineChartData = Object.values(timelineData || {}).sort((a, b) => a.date.localeCompare(b.date));

  // Publishing stats pie data
  const pieData = data ? [
    { name: "Published", value: data.publishing_stats.total_published },
    { name: "Failed", value: data.publishing_stats.total_failed },
    { name: "Pending", value: data.publishing_stats.total_scheduled - data.publishing_stats.total_published - data.publishing_stats.total_failed },
  ].filter(d => d.value > 0) : [];

  // Platform comparison bar data
  const platformBarData = data ? [
    { name: "Facebook", Scheduled: data.publishing_stats.by_platform.facebook },
    { name: "Instagram", Scheduled: data.publishing_stats.by_platform.instagram },
  ] : [];

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
                  <BreadcrumbPage>Analytics</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Period:</label>
                  <select
                    className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={28}>28 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Platform:</label>
                  <select
                    className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                  >
                    <option value="">All platforms</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                {(data?.metrics.length ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                    <Clock className="size-3" />
                    <span>Updated {timeSinceUpdate}</span>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => fetchAnalytics(true)} disabled={isRefreshing}>
                  <RefreshCw className={`mr-1.5 size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-1.5 size-3.5" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : !data || data.metrics.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
                <TrendingUp className="mb-3 size-12 opacity-50" />
                <CardTitle className="text-lg mb-1">No analytics data</CardTitle>
                <CardDescription>
                  Connect a Facebook Page or Instagram Business account to see analytics.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Accounts with errors */}
              {data.metrics.some((m) => m.data.error) && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <p>{data.metrics.filter((m) => m.data.error).length} account(s) have expired tokens or errors. Reconnect them in Social Connections.</p>
                </div>
              )}

              {/* Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Total Followers</p>
                      <Users className="size-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold mt-1">{data.aggregated.total_followers.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Engagement</p>
                      <MessageSquare className="size-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold mt-1">{data.aggregated.total_engagement.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Reach</p>
                      <Eye className="size-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold mt-1">{data.aggregated.total_reach.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Impressions</p>
                      <TrendingUp className="size-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold mt-1">{data.aggregated.total_impressions.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Reach Over Time</CardTitle>
                  <CardDescription>Daily reach across connected accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="reach"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={false}
                          name="Total Reach"
                        />
                        {data.metrics.filter(m => m.platform === 'facebook').length > 0 && (
                          <Line
                            type="monotone"
                            dataKey="facebook_reach"
                            stroke="#3b82f6"
                            strokeWidth={1}
                            dot={false}
                            name="Facebook"
                            strokeDasharray="4 4"
                          />
                        )}
                        {data.metrics.filter(m => m.platform === 'instagram').length > 0 && (
                          <Line
                            type="monotone"
                            dataKey="instagram_reach"
                            stroke="#ec4899"
                            strokeWidth={1}
                            dot={false}
                            name="Instagram"
                            strokeDasharray="4 4"
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Bottom charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Publishing Status Pie */}
                <Card>
                  <CardHeader>
                    <CardTitle>Publishing Status</CardTitle>
                    <CardDescription>Distribution of scheduled post outcomes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(entry: { name?: string; percent?: number }) => `${entry.name ?? ''} ${((entry.percent ?? 0) * 100).toFixed(0)}%`}
                          >
                            {pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Platform Comparison Bar */}
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Comparison</CardTitle>
                    <CardDescription>Posts scheduled by platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={platformBarData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip
                            contentStyle={{
                              background: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="Scheduled" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Per-account breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Per-Account Metrics</CardTitle>
                  <CardDescription>Breakdown by connected account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.metrics.map((m) => (
                      <div key={m.connection_id} className={`rounded-lg border p-3 ${m.data.error ? 'border-destructive/50' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                          {m.platform === "facebook" ? (
                            <FacebookIcon className="size-4 text-blue-600" />
                          ) : (
                            <InstagramIcon className="size-4 text-pink-600" />
                          )}
                          <span className="text-sm font-medium">{m.name}</span>
                          {m.is_expired && (
                            <span className="text-xs text-destructive">Token expired</span>
                          )}
                        </div>
                        {m.data.error ? (
                          <p className="text-xs text-destructive">{m.data.error}</p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Followers</span>
                              <p className="font-medium">{m.data.followers?.toLocaleString() ?? "—"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Reach</span>
                              <p className="font-medium">{m.data.total_reach?.toLocaleString() ?? "—"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Engagement</span>
                              <p className="font-medium">{m.data.total_engagement?.toLocaleString() ?? "—"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Impressions</span>
                              <p className="font-medium">{m.data.total_impressions?.toLocaleString() ?? (m.data.total_views?.toLocaleString() ?? "—")}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
