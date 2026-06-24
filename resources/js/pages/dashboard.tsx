import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Hash,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  in_review_posts: number;
  categories_count: number;
  tags_count: number;
  media_count: number;
  recent_posts: Array<{
    id: number;
    title: string;
    status: string;
    created_at: string;
  }>;
}

const statusBadge: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  in_review: { label: "In Review", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  published: { label: "Published", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  scheduled: { label: "Scheduled", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats");
        setStats(response.data.stats);
      } catch {
        // handle error
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Posts",
      value: stats?.total_posts ?? 0,
      description: "All blog posts",
      icon: FileText,
    },
    {
      title: "Published",
      value: stats?.published_posts ?? 0,
      description: "Live on blog",
      icon: CheckCircle2,
    },
    {
      title: "Drafts",
      value: stats?.draft_posts ?? 0,
      description: "Work in progress",
      icon: Clock,
    },
    {
      title: "In Review",
      value: stats?.in_review_posts ?? 0,
      description: "Pending approval",
      icon: AlertCircle,
    },
    {
      title: "Categories",
      value: stats?.categories_count ?? 0,
      description: "Content taxonomy",
      icon: Tag,
    },
    {
      title: "Tags",
      value: stats?.tags_count ?? 0,
      description: "Content labels",
      icon: Hash,
    },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Welcome back, {user?.name || "User"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats Grid */}
          <div className="grid auto-rows-min gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Posts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Posts</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your most recently created posts
                </p>
              </div>
              <Link to="/posts">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-md" />
                  ))}
                </div>
              ) : !stats?.recent_posts || stats.recent_posts.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <FileText className="mb-2 size-8" />
                  <p className="text-sm">No posts yet.</p>
                  <Link to="/posts/create" className="mt-2">
                    <Button size="sm">
                      Create your first post
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recent_posts.map((post) => {
                    const badge = statusBadge[post.status] || statusBadge.draft;
                    return (
                      <Link
                        key={post.id}
                        to={`/posts/${post.id}/edit`}
                        className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm font-medium truncate">
                            {post.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
