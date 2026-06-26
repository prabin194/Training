import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  History,
} from "lucide-react";
import api from "@/lib/api";

interface HistoryEntry {
  id: number;
  platform: "facebook" | "instagram";
  content: string | null;
  image_url: string | null;
  scheduled_at: string;
  published_at: string | null;
  status: "pending" | "processing" | "published" | "failed";
  failure_reason: string | null;
  retry_count: number;
  post_title: string | null;
  account_name: string | null;
  created_at: string;
}

function FacebookIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function InstagramIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  pending: { label: "Pending", icon: <Clock className="size-3" />, className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" },
  processing: { label: "Processing", icon: <Loader2 className="size-3 animate-spin" />, className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  published: { label: "Published", icon: <CheckCircle2 className="size-3" />, className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  failed: { label: "Failed", icon: <XCircle className="size-3" />, className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export default function PublishingHistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  // Auto-refresh polling
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadHistory = useCallback(async (p = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, per_page: 20 };
      if (statusFilter) params.status = statusFilter;
      if (platformFilter) params.platform = platformFilter;

      const response = await api.get("/schedule/history", { params });
      setEntries(response.data.data);
      setPage(response.data.current_page);
      setTotalPages(response.data.last_page);
      setTotal(response.data.total);
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, platformFilter]);

  useEffect(() => {
    loadHistory(1);
  }, [loadHistory]);

  // Auto-refresh every 15 seconds when there are processing/pending entries
  useEffect(() => {
    if (!autoRefresh) return;
    const hasActive = entries.some((e) => e.status === "processing" || e.status === "pending");
    if (!hasActive) return;

    const interval = setInterval(() => {
      loadHistory(page);
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefresh, entries, page, loadHistory]);

  const handleRetry = async (entry: HistoryEntry) => {
    setError(null);
    setSuccess(null);
    setIsRetrying(entry.id);

    try {
      await api.post(`/schedule/entries/${entry.id}/retry`);
      setSuccess(`Retrying post for ${entry.account_name || entry.platform}...`);
      // Refresh after a moment to show updated status
      setTimeout(() => loadHistory(page), 1000);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e.response?.data?.message || "Failed to retry.");
      } else {
        setError("Network error.");
      }
    } finally {
      setIsRetrying(null);
    }
  };

  const openDetail = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
    setShowDetailSheet(true);
  };

  const summaryStats = {
    total,
    published: entries.filter((e) => e.status === "published").length,
    failed: entries.filter((e) => e.status === "failed").length,
    pending: entries.filter((e) => e.status === "pending").length,
    processing: entries.filter((e) => e.status === "processing").length,
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
                  <BreadcrumbPage>Publishing History</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-md border border-green-500/50 bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
              <CheckCircle2 className="size-4 shrink-0" />
              <p>{success}</p>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">Published</p>
                <p className="text-xl font-bold text-green-600">{summaryStats.published}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-xl font-bold text-red-600">{summaryStats.failed}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">Processing</p>
                <p className="text-xl font-bold text-amber-600">{summaryStats.processing}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="published">Published</option>
                  <option value="failed">Failed</option>
                </select>
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={platformFilter}
                  onChange={(e) => { setPlatformFilter(e.target.value); setPage(1); }}
                >
                  <option value="">All platforms</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* History List */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
                <History className="mb-3 size-10 opacity-50" />
                <CardTitle className="text-lg mb-1">No publishing history</CardTitle>
                <CardDescription>
                  Scheduled posts will appear here once they've been processed.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const status = statusConfig[entry.status] || statusConfig.pending;
                return (
                  <Card
                    key={entry.id}
                    className="transition-colors hover:bg-accent/50 cursor-pointer"
                    onClick={() => openDetail(entry)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {entry.platform === "facebook" ? (
                              <FacebookIcon className="size-4 text-blue-600 shrink-0" />
                            ) : (
                              <InstagramIcon className="size-4 text-pink-600 shrink-0" />
                            )}
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                              {status.icon}
                              {status.label}
                            </span>
                          </div>
                          <p className="text-sm font-medium line-clamp-1">
                            {entry.content || entry.post_title || `${entry.platform} post`}
                          </p>
                          {entry.failure_reason && entry.status === "failed" && (
                            <p className="mt-0.5 text-xs text-destructive line-clamp-1">
                              {entry.failure_reason}
                            </p>
                          )}
                          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{entry.account_name || "—"}</span>
                            <span>{new Date(entry.scheduled_at).toLocaleString()}</span>
                            {entry.published_at && (
                              <span>Published {new Date(entry.published_at).toLocaleString()}</span>
                            )}
                            {entry.retry_count > 0 && (
                              <span>Retries: {entry.retry_count}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {entry.status === "failed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleRetry(entry); }}
                              disabled={isRetrying === entry.id}
                            >
                              {isRetrying === entry.id ? (
                                <Loader2 className="mr-1 size-3 animate-spin" />
                              ) : (
                                <RefreshCw className="mr-1 size-3" />
                              )}
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadHistory(page - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => loadHistory(page + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail Sheet */}
        <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Publish Details</SheetTitle>
              <SheetDescription>
                {selectedEntry?.content || selectedEntry?.post_title || "Schedule entry"}
              </SheetDescription>
            </SheetHeader>
            {selectedEntry && (
              <div className="space-y-4 p-4">
                <div className="flex items-center gap-2">
                  {selectedEntry.platform === "facebook" ? (
                    <FacebookIcon className="size-5 text-blue-600" />
                  ) : (
                    <InstagramIcon className="size-5 text-pink-600" />
                  )}
                  <span className="text-sm font-medium capitalize">{selectedEntry.platform}</span>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${(statusConfig[selectedEntry.status] || statusConfig.pending).className}`}>
                    {(statusConfig[selectedEntry.status] || statusConfig.pending).icon}
                    {(statusConfig[selectedEntry.status] || statusConfig.pending).label}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Account</p>
                  <p className="text-sm">{selectedEntry.account_name || "—"}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Scheduled</p>
                  <p className="text-sm">{new Date(selectedEntry.scheduled_at).toLocaleString()}</p>
                </div>

                {selectedEntry.published_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Published</p>
                    <p className="text-sm">{new Date(selectedEntry.published_at).toLocaleString()}</p>
                  </div>
                )}

                {selectedEntry.content && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Content</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedEntry.content}</p>
                  </div>
                )}

                {selectedEntry.failure_reason && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                    <p className="text-xs text-destructive font-medium mb-1">Error Details</p>
                    <p className="text-sm text-destructive whitespace-pre-wrap">{selectedEntry.failure_reason}</p>
                    {selectedEntry.retry_count > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Retried {selectedEntry.retry_count} time{selectedEntry.retry_count !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                )}

                <SheetFooter className="flex-row gap-2 pt-4">
                  {selectedEntry.status === "failed" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          handleRetry(selectedEntry);
                          setShowDetailSheet(false);
                        }}
                        disabled={isRetrying === selectedEntry.id}
                      >
                        {isRetrying === selectedEntry.id ? (
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-1.5 size-3.5" />
                        )}
                        Retry
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await api.delete(`/schedule/entries/${selectedEntry.id}`);
                            setShowDetailSheet(false);
                            setSuccess("Entry deleted.");
                            setTimeout(() => setSuccess(null), 3000);
                            loadHistory(page);
                          } catch {
                            setError("Failed to delete.");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setShowDetailSheet(false)}>
                    Close
                  </Button>
                </SheetFooter>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </SidebarInset>
    </SidebarProvider>
  );
}
