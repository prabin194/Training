import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface UserItem {
  id: number;
  uid: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface PaginatedUsers {
  data: UserItem[];
  current_page: number;
  last_page: number;
  total: number;
}

const roleIcons: Record<string, React.ReactNode> = {
  admin: <ShieldAlert className="size-4 text-destructive" />,
  editor: <ShieldCheck className="size-4 text-amber-500" />,
  author: <Shield className="size-4 text-muted-foreground" />,
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  author: "Author",
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<PaginatedUsers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const loadUsers = async (page = 1) => {
    try {
      const response = await api.get(`/users?page=${page}`);
      setUsers(response.data);
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    setIsUpdating(userId);
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map((u) =>
            u.id === userId ? { ...u, role: newRole } : u
          ),
        };
      });
    } catch {
      // handle error
    } finally {
      setIsUpdating(null);
    }
  };

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
                  <BreadcrumbPage>Manage Users</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex-1 p-4 pt-0 max-w-3xl">
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
            <p className="text-sm text-muted-foreground">
              {users?.total || 0} total user{(users?.total || 0) !== 1 ? "s" : ""}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-md" />
                  ))}
                </div>
              ) : !users || users.data.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <Users className="mb-2 size-8" />
                  <p className="text-sm">No users found.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {users.data.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                          {roleIcons[u.role] || roleIcons.author}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={isUpdating === u.id || u.id === user.id}
                        >
                          <option value="author">Author</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                        {isUpdating === u.id && (
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {users && users.last_page > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={users.current_page <= 1}
                    onClick={() => loadUsers(users.current_page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {users.current_page} of {users.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={users.current_page >= users.last_page}
                    onClick={() => loadUsers(users.current_page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
