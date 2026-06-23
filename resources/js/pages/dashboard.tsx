import { useAuth } from "@/lib/auth-context";
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
import { User, Calendar, Activity, Shield } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: "Posts",
      value: "0",
      description: "Total blog posts",
      icon: Activity,
    },
    {
      title: "Scheduled",
      value: "0",
      description: "Pending social posts",
      icon: Calendar,
    },
    {
      title: "Devices",
      value: "0",
      description: "Active sessions",
      icon: Shield,
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
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="min-h-[300px] flex-1 rounded-xl border border-dashed flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">
                Blog management features coming soon.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Phase 2 will bring post creation, editing, and more.
              </p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
