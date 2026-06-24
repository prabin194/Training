import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { fetchPosts, deletePost, type Post } from "@/lib/blog-api";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  draft: { label: "Draft", icon: <Clock className="size-3" />, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  in_review: { label: "In Review", icon: <AlertCircle className="size-3" />, className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  approved: { label: "Approved", icon: <CheckCircle2 className="size-3" />, className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  rejected: { label: "Rejected", icon: <XCircle className="size-3" />, className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  published: { label: "Published", icon: <Eye className="size-3" />, className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  scheduled: { label: "Scheduled", icon: <Clock className="size-3" />, className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  archived: { label: "Archived", icon: <Archive className="size-3" />, className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400" },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function Archive(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="5" x="2" y="3" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  );
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchPosts({
        page,
        per_page: 15,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setPosts(response.data);
      setTotalPages(response.last_page);
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // handle error
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPosts();
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
                  <BreadcrumbPage>Posts</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
              <p className="text-sm text-muted-foreground">Manage your blog posts</p>
            </div>
            <Link to="/posts/create">
              <Button>
                <Plus className="mr-1.5 size-4" />
                New Post
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search posts..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
                <Button type="submit" variant="secondary">Search</Button>
              </form>
            </CardContent>
          </Card>

          {/* Posts List */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-3 size-10 text-muted-foreground/50" />
                <CardTitle className="mb-1 text-lg">No posts yet</CardTitle>
                <CardDescription className="mb-4">
                  Create your first blog post to get started.
                </CardDescription>
                <Link to="/posts/create">
                  <Button>
                    <Plus className="mr-1.5 size-4" />
                    Create Post
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <Card key={post.id} className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-start gap-4 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={post.status} />
                        {post.published_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.published_at).toLocaleDateString()}
                          </span>
                        )}
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
                        <span>{post.author?.name || "Unknown"}</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        {post.categories?.length > 0 && (
                          <span>
                            {post.categories.map((c) => c.name).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link to={`/posts/${post.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="size-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
