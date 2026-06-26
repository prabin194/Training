import { useState, useEffect, useRef, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Loader2,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
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
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import api from "@/lib/api";
import {
  fetchSocialConnections,
  type SocialConnection,
} from "@/lib/blog-api";

interface ScheduleEntry {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    platform: string;
    status: string;
    content: string | null;
    image_url: string | null;
    account_name: string | null;
    post_id: number | null;
    failure_reason: string | null;
    retry_count: number;
  };
}

export default function SchedulingPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form state
  const [formPlatform, setFormPlatform] = useState("facebook");
  const [formConnectionId, setFormConnectionId] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formScheduledAt, setFormScheduledAt] = useState("");

  const loadEntries = useCallback(async () => {
    try {
      const response = await api.get("/schedule/entries");
      setEntries(response.data.entries);
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadConnections = useCallback(async () => {
    try {
      const response = await api.get("/social/connections");
      setSocialConnections(response.data.connections);
    } catch {
      // handle error
    }
  }, []);

  useEffect(() => {
    Promise.all([loadEntries(), loadConnections()]);
  }, [loadEntries, loadConnections]);

  const handleEventClick = (info: EventClickArg) => {
    const raw = info.event;
    setSelectedEntry({
      id: raw.id,
      title: raw.title,
      start: raw.start?.toISOString() ?? "",
      allDay: raw.allDay,
      backgroundColor: raw.backgroundColor,
      borderColor: raw.borderColor,
      extendedProps: raw.extendedProps as ScheduleEntry["extendedProps"],
    });
    setShowDetailSheet(true);
  };

  const handleEventDrop = async (info: EventDropArg) => {
    const entryId = info.event.id;
    const newStart = info.event.start?.toISOString();

    if (!newStart) {
      info.revert();
      return;
    }

    try {
      await api.put(`/schedule/entries/${entryId}/reschedule`, {
        scheduled_at: newStart,
      });
      setSuccess("Post rescheduled.");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      info.revert();
      setError("Failed to reschedule. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCreate = async () => {
    if (!formConnectionId || !formScheduledAt) return;

    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const now = new Date();
      const scheduledDate = new Date(formScheduledAt);
      if (scheduledDate <= now) {
        setError("Cannot schedule a post in the past.");
        setIsSaving(false);
        return;
      }

      await api.post("/schedule/entries", {
        social_connection_id: Number(formConnectionId),
        platform: formPlatform,
        content: formContent || null,
        image_url: formImageUrl || null,
        scheduled_at: formScheduledAt,
      });

      setShowCreateSheet(false);
      resetForm();
      setSuccess("Post scheduled successfully!");
      await loadEntries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        setError(e.response?.data?.message || e.response?.data?.errors?.scheduled_at?.[0] || "Failed to schedule post.");
      } else {
        setError("Network error.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    if (!confirm(`Delete this scheduled post for ${selectedEntry.extendedProps.platform}?`)) return;

    try {
      await api.delete(`/schedule/entries/${selectedEntry.id}`);
      setShowDetailSheet(false);
      setSelectedEntry(null);
      setSuccess("Schedule entry deleted.");
      await loadEntries();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to delete entry.");
    }
  };

  const resetForm = () => {
    setFormPlatform("facebook");
    setFormConnectionId("");
    setFormContent("");
    setFormImageUrl("");
    setFormScheduledAt("");
  };

  const todayStr = new Date().toISOString().slice(0, 10);

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
                  <BreadcrumbPage>Scheduling Calendar</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Flash messages */}
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

          {/* Calendar */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Content Calendar</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Drag and drop to reschedule. Click an event to view details.
                </p>
              </div>
              <Button onClick={() => { setShowCreateSheet(true); resetForm(); }}>
                <Plus className="mr-1.5 size-4" />
                New Schedule
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[500px] rounded-md" />
              ) : (
                <div className="calendar-container [&_.fc]:text-sm [&_.fc-button]:h-8 [&_.fc-button]:px-3 [&_.fc-toolbar-title]:text-base [&_.fc-daygrid-event]:cursor-pointer">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                      left: "prev,next today",
                      center: "title",
                      right: "dayGridMonth,dayGridWeek",
                    }}
                    events={entries}
                    editable={true}
                    eventClick={handleEventClick}
                    eventDrop={handleEventDrop}
                    height="auto"
                    firstDay={0}
                    nowIndicator={true}
                    eventTimeFormat={{
                      hour: "numeric",
                      minute: "2-digit",
                      meridiem: "short",
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create Sheet */}
        <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Schedule a Post</SheetTitle>
              <SheetDescription>
                Create a new social media schedule entry.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 p-4">
              {/* Platform */}
              <div>
                <Label>Platform</Label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPlatform("facebook")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md border p-2.5 text-sm font-medium transition-colors ${
                      formPlatform === "facebook"
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                        : "border-input hover:bg-accent"
                    }`}
                  >
                    <FacebookIcon className="size-4" />
                    Facebook
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPlatform("instagram")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md border p-2.5 text-sm font-medium transition-colors ${
                      formPlatform === "instagram"
                        ? "border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-400"
                        : "border-input hover:bg-accent"
                    }`}
                  >
                    <InstagramIcon className="size-4" />
                    Instagram
                  </button>
                </div>
              </div>

              {/* Social Account */}
              <div>
                <Label>Account</Label>
                <select
                  className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={formConnectionId}
                  onChange={(e) => setFormConnectionId(e.target.value)}
                >
                  <option value="">Select an account...</option>
                  {socialConnections
                    .filter((c) => c.provider === `${formPlatform}_page` || c.provider === `${formPlatform}_business`)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.provider === "facebook_page" ? "Facebook" : "Instagram"})
                      </option>
                    ))}
                </select>
              </div>

              {/* Content */}
              <div>
                <Label>Content (optional)</Label>
                <textarea
                  className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Write your post content..."
                  rows={4}
                  maxLength={2200}
                />
                <p className="mt-1 text-xs text-muted-foreground">{formContent.length}/2200</p>
              </div>

              {/* Image URL */}
              {formPlatform === "instagram" && (
                <div>
                  <Label>Image URL {formPlatform === "instagram" ? "(required)" : ""}</Label>
                  <Input
                    className="mt-1"
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formPlatform === "instagram" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Instagram posts require an image.
                    </p>
                  )}
                </div>
              )}

              {/* Schedule Date */}
              <div>
                <Label>Schedule Date & Time</Label>
                <Input
                  className="mt-1"
                  type="datetime-local"
                  value={formScheduledAt}
                  onChange={(e) => setFormScheduledAt(e.target.value)}
                  min={todayStr + "T00:00"}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <SheetFooter className="p-4">
              <Button variant="outline" onClick={() => setShowCreateSheet(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isSaving || !formConnectionId || !formScheduledAt || (formPlatform === "instagram" && !formImageUrl)}>
                {isSaving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <CalendarIcon className="mr-1.5 size-4" />}
                Schedule
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Detail Sheet */}
        <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Schedule Details</SheetTitle>
              <SheetDescription>
                {selectedEntry?.title}
              </SheetDescription>
            </SheetHeader>
            {selectedEntry && (
              <div className="space-y-4 p-4">
                <div className="flex items-center gap-2">
                  {selectedEntry.extendedProps.platform === "facebook" ? (
                    <FacebookIcon className="size-5 text-blue-600" />
                  ) : (
                    <InstagramIcon className="size-5 text-pink-600" />
                  )}
                  <span className="text-sm font-medium capitalize">{selectedEntry.extendedProps.platform}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>{new Date(selectedEntry.start).toLocaleString()}</span>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-0.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      selectedEntry.extendedProps.status === "published"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : selectedEntry.extendedProps.status === "failed"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : selectedEntry.extendedProps.status === "processing"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
                    }`}>
                      {selectedEntry.extendedProps.status}
                    </span>
                  </div>
                </div>

                {selectedEntry.extendedProps.account_name && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Account</Label>
                    <p className="text-sm">{selectedEntry.extendedProps.account_name}</p>
                  </div>
                )}

                {selectedEntry.extendedProps.content && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Content</Label>
                    <p className="mt-0.5 text-sm whitespace-pre-wrap">{selectedEntry.extendedProps.content}</p>
                  </div>
                )}

                {selectedEntry.extendedProps.failure_reason && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                    <Label className="text-xs text-destructive">Failure Reason</Label>
                    <p className="mt-0.5 text-sm text-destructive">{selectedEntry.extendedProps.failure_reason}</p>
                    {selectedEntry.extendedProps.retry_count > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Retried {selectedEntry.extendedProps.retry_count} time{selectedEntry.extendedProps.retry_count !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                )}

                <SheetFooter className="flex-row gap-2 pt-4">
                  {(selectedEntry.extendedProps.status === "pending" || selectedEntry.extendedProps.status === "failed") && (
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                      <Trash2 className="mr-1.5 size-3.5" />
                      Delete
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setShowDetailSheet(false)}>
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
