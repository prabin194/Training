import { useState, useEffect, useRef } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import {
  Loader2,
  Link2,
  Unlink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

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

interface SocialConnection {
  id: number;
  provider: "facebook_page" | "instagram_business";
  provider_account_id: string;
  name: string;
  metadata: {
    category?: string;
    profile_pic?: string;
    facebook_page_name?: string;
    facebook_page_id?: string;
  } | null;
  is_expired: boolean;
  created_at: string;
}

export default function SocialConnectionsPage() {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await api.get("/social/connections");
      setConnections(response.data.connections);
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleConnectFacebook = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsConnecting(true);

    try {
      const response = await api.post("/social/facebook/connect");
      const { redirect_url } = response.data;

      // Open the Facebook OAuth dialog in a popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;

      const popup = window.open(
        redirect_url,
        "facebook-oauth",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        setError("Popup blocked. Please allow popups for this site and try again.");
        setIsConnecting(false);
        return;
      }

      // Poll for the popup to close and send us the code
      const pollTimer = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(pollTimer);
            pollTimerRef.current = null;
            setIsConnecting(false);
            // Refresh connections after popup closes
            await fetchConnections();
            setSuccessMessage("Social accounts connected successfully!");
            return;
          }
        } catch {
          // Cross-origin access error - typical during OAuth
        }
      }, 500);
      pollTimerRef.current = pollTimer;

      // Also set a timeout
      setTimeout(() => {
        clearInterval(pollTimer);
        pollTimerRef.current = null;
        setIsConnecting(false);
      }, 120000); // 2 minute timeout
    } catch (err: unknown) {
      setIsConnecting(false);
      if (err && typeof err === "object" && "response" in err) {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e.response?.data?.message || "Failed to initiate Facebook connection.");
      } else {
        setError("Network error. Please try again.");
      }
    }
  };

  const handleDisconnect = async (connection: SocialConnection) => {
    if (!confirm(`Disconnect ${connection.name}?`)) return;

    setError(null);
    setSuccessMessage(null);

    try {
      await api.delete(`/social/connections/${connection.id}`);
      setConnections((prev) => prev.filter((c) => c.id !== connection.id));
      setSuccessMessage(`${connection.name} disconnected successfully.`);
    } catch {
      setError("Failed to disconnect. Please try again.");
    }
  };

  const facebookConnections = connections.filter((c) => c.provider === "facebook_page");
  const instagramConnections = connections.filter((c) => c.provider === "instagram_business");

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
                  <BreadcrumbPage>Social Connections</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 max-w-2xl">
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-md border border-green-500/50 bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
              <CheckCircle2 className="size-4 shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}

          {/* Facebook Pages */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FacebookIcon className="size-5 text-blue-600" />
                  <CardTitle>Facebook Pages</CardTitle>
                </div>
              </div>
              <CardDescription>
                Connect Facebook Pages to schedule and publish posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-md" />
                  ))}
                </div>
              ) : facebookConnections.length > 0 ? (
                <div className="space-y-3">
                  {facebookConnections.map((conn) => (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <FacebookIcon className="size-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{conn.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {conn.metadata?.category || "Facebook Page"}
                            {conn.is_expired && (
                              <span className="ml-2 text-destructive font-medium">
                                Token expired
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(conn)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Unlink className="mr-1.5 size-3.5" />
                        Disconnect
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-muted-foreground">
                  <FacebookIcon className="mb-2 size-8 opacity-50" />
                  <p className="text-sm">No Facebook Pages connected.</p>
                  <p className="text-xs mt-0.5">
                    Connect a Facebook Page to start scheduling posts.
                  </p>
                </div>
              )}

              <div className="mt-4">
                <Button
                  onClick={handleConnectFacebook}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                  ) : (
                    <Link2 className="mr-1.5 size-4" />
                  )}
                  {isConnecting ? "Connecting..." : "Connect Facebook Page"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instagram Business */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <InstagramIcon className="size-5 text-pink-600" />
                <CardTitle>Instagram Business</CardTitle>
              </div>
              <CardDescription>
                Instagram Business accounts linked to your connected Facebook Pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-md" />
                  ))}
                </div>
              ) : instagramConnections.length > 0 ? (
                <div className="space-y-3">
                  {instagramConnections.map((conn) => (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30">
                          <InstagramIcon className="size-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">@{conn.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {conn.metadata?.facebook_page_name
                              ? `Linked to ${conn.metadata.facebook_page_name}`
                              : "Instagram Business Account"}
                            {conn.is_expired && (
                              <span className="ml-2 text-destructive font-medium">
                                Token expired
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(conn)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Unlink className="mr-1.5 size-3.5" />
                        Disconnect
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-muted-foreground">
                  <InstagramIcon className="mb-2 size-8 opacity-50" />
                  <p className="text-sm">No Instagram accounts connected.</p>
                  <p className="text-xs mt-0.5">
                    Connect a Facebook Page with a linked Instagram Business account to get started.
                  </p>
                </div>
              )}

              {facebookConnections.length === 0 && (
                <p className="mt-3 text-xs text-muted-foreground text-center">
                  Connect a Facebook Page first to see linked Instagram accounts.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
