import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import {
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  Loader2,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  fetchPendingReviews,
  approvePost,
  rejectPost,
  fetchTransitions,
  type Post,
  type Transition,
} from "@/lib/blog-api";
import { useAuth } from "@/lib/auth-context";

const statusBadge: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  in_review: { label: "In Review", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  approved: { label: "Approved", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  published: { label: "Published", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  scheduled: { label: "Scheduled", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
};

export default function ReviewQueuePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [showApproveSheet, setShowApproveSheet] = useState(false);
  const [showRejectSheet, setShowRejectSheet] = useState(false);
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchPendingReviews({ page, per_page: 20 });
      setPosts(response.data);
      setTotalPages(response.last_page);
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleApprove = async () => {
    if (!selectedPost) return;
    setIsProcessing(true);
    try {
      await approvePost(selectedPost.id, reviewComment || undefined);
      setPosts((prev) => prev.filter((p) => p.id !== selectedPost.id));
      setShowApproveSheet(false);
      setReviewComment("");
      setSelectedPost(null);
    } catch {
      // handle error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPost || !reviewComment.trim()) return;
    setIsProcessing(true);
    try {
      await rejectPost(selectedPost.id, reviewComment);
      setPosts((prev) => prev.filter((p) => p.id !== selectedPost.id));
      setShowRejectSheet(false);
      setReviewComment("");
      setSelectedPost(null);
    } catch {
      // handle error
    } finally {
      setIsProcessing(false);
    }
  };

  const openHistory = async (post: Post) => {
    setSelectedPost(post);
    setShowHistorySheet(true);
    try {
      const data = await fetchTransitions(post.id);
      setTransitions(data);
    } catch {
      setTransitions([]);
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "editor")) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full py-20 text-muted-foreground">
            You don't have permission to access this page.
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
                  <BreadcrumbPage>Review Queue</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex-1 p-4 pt-0">
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight">Review Queue</h1>
            <p className="text-sm text-muted-foreground">
              {posts.length} post{posts.length !== 1 ? "s" : ""} pending review
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
                <CheckCircle2 className="mb-3 size-10" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs">No posts pending review.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <Card key={post.id} className="transition-colors hover:bg-accent/50">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            <AlertCircle className="size-3" />
                            In Review
                          </span>
                        </div>
                        <Link
                          to={`/posts/${post.id}/edit`}
                          className="text-base font-semibold hover:text-primary transition-colors line-clamp-1"
                        >
                          {post.title}
                        </Link>
                        {post.excerpt && (
                          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>By {post.author?.name || "Unknown"}</span>
                          <span>Submitted {new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPost(post);
                            openHistory(post);
                          }}
                        >
                          <Clock className="mr-1 size-3" />
                          History
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPost(post);
                            setReviewComment("");
                            setShowRejectSheet(true);
                          }}
                        >
                          <XCircle className="mr-1 size-3 text-destructive" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPost(post);
                            setReviewComment("");
                            setShowApproveSheet(true);
                          }}
                        >
                          <CheckCircle2 className="mr-1 size-3" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Approve Sheet */}
        <Sheet open={showApproveSheet} onOpenChange={setShowApproveSheet}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Approve Post</SheetTitle>
              <SheetDescription>
                Confirm approval for "{selectedPost?.title}"
              </SheetDescription>
            </SheetHeader>
            <div className="p-4 space-y-4">
              <div>
                <Label>Comment (optional)</Label>
                <textarea
                  className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                />
              </div>
            </div>
            <SheetFooter className="p-4">
              <Button variant="outline" onClick={() => setShowApproveSheet(false)}>Cancel</Button>
              <Button onClick={handleApprove} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 size-4" />}
                Approve
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Reject Sheet */}
        <Sheet open={showRejectSheet} onOpenChange={setShowRejectSheet}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Reject Post</SheetTitle>
              <SheetDescription>
                Provide feedback for "{selectedPost?.title}"
              </SheetDescription>
            </SheetHeader>
            <div className="p-4 space-y-4">
              <div>
                <Label>Feedback *</Label>
                <textarea
                  className="mt-1 w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Explain why the post is being rejected..."
                  rows={5}
                />
              </div>
            </div>
            <SheetFooter className="p-4">
              <Button variant="outline" onClick={() => setShowRejectSheet(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !reviewComment.trim()}>
                {isProcessing ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <XCircle className="mr-1.5 size-4" />}
                Reject
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* History Sheet */}
        <Sheet open={showHistorySheet} onOpenChange={setShowHistorySheet}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Post History</SheetTitle>
              <SheetDescription>
                Status changes for "{selectedPost?.title}"
              </SheetDescription>
            </SheetHeader>
            <div className="p-4 space-y-3">
              {transitions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No transitions recorded yet.</p>
              ) : (
                transitions.map((t) => (
                  <div key={t.id} className="rounded-md border p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusBadge[t.from_status]?.className || ""}`}>
                        {statusBadge[t.from_status]?.label || t.from_status}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusBadge[t.to_status]?.className || ""}`}>
                        {statusBadge[t.to_status]?.label || t.to_status}
                      </span>
                    </div>
                    {t.comment && (
                      <p className="mt-1 text-xs text-muted-foreground">{t.comment}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      By {t.user_name} · {new Date(t.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
      </SidebarInset>
    </SidebarProvider>
  );
}
