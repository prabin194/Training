import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  Send,
  Inbox,
  Trash2,
  Reply,
  Loader2,
  Plus,
  ChevronLeft,
  Eye,
} from "lucide-react";
import api from "@/lib/api";

interface MessageUser {
  id: number;
  name: string;
  email: string;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  subject: string;
  body: string;
  read_at: string | null;
  parent_id: number | null;
  created_at: string;
  sender: MessageUser;
  receiver: MessageUser;
}

interface PaginatedMessages {
  data: Message[];
  current_page: number;
  last_page: number;
  total: number;
}

type View = "inbox" | "sent" | "compose" | "detail";

export default function MessagesPage() {
  const [view, setView] = useState<View>("inbox");
  const [messages, setMessages] = useState<PaginatedMessages | null>(null);
  const [sentMessages, setSentMessages] = useState<PaginatedMessages | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [users, setUsers] = useState<MessageUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);

  // Compose form state
  const [composeReceiver, setComposeReceiver] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const fetchInbox = useCallback(async (p = 1) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/messages/inbox?page=${p}`);
      setMessages(response.data);
      setUnreadCount(response.data.unread_count);
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSent = useCallback(async (p = 1) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/messages/sent?page=${p}`);
      setSentMessages(response.data);
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/messages/users");
      setUsers(response.data.users);
    } catch {
      // handle error
    }
  }, []);

  useEffect(() => {
    if (view === "inbox") fetchInbox(page);
    if (view === "sent") fetchSent(page);
    if (view === "compose") fetchUsers();
  }, [view, page, fetchInbox, fetchSent, fetchUsers]);

  const openDetail = async (message: Message) => {
    try {
      const response = await api.get(`/messages/${message.id}`);
      setSelectedMessage(response.data.message);
      setView("detail");
      // Refresh inbox to update unread count
      fetchInbox(1);
    } catch {
      // handle error
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/messages/${id}`);
      fetchInbox(1);
    } catch {
      // handle error
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeReceiver || !composeSubject || !composeBody) return;

    setIsSending(true);
    try {
      await api.post("/messages", {
        receiver_id: Number(composeReceiver),
        subject: composeSubject,
        body: composeBody,
      });

      setComposeReceiver("");
      setComposeSubject("");
      setComposeBody("");
      setView("sent");
      fetchSent(1);
    } catch {
      // handle error
    } finally {
      setIsSending(false);
    }
  };

  const startReply = (message: Message) => {
    setComposeReceiver(String(message.sender_id));
    setComposeSubject(`Re: ${message.subject}`);
    setComposeBody("");
    setView("compose");
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
                {view === "detail" ? (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink onClick={() => setView("inbox")}>Messages</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{selectedMessage?.subject ?? "Message"}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbPage>{view === "compose" ? "New Message" : view === "sent" ? "Sent Messages" : "Messages"}</BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 max-w-3xl">
          {/* Action bar */}
          <div className="flex items-center gap-2">
            <Button
              variant={view === "inbox" ? "default" : "outline"}
              size="sm"
              onClick={() => { setView("inbox"); setPage(1); }}
            >
              <Inbox className="mr-1.5 size-3.5" />
              Inbox {unreadCount > 0 && `(${unreadCount})`}
            </Button>
            <Button
              variant={view === "sent" ? "default" : "outline"}
              size="sm"
              onClick={() => { setView("sent"); setPage(1); }}
            >
              <Send className="mr-1.5 size-3.5" />
              Sent
            </Button>
            <Button
              variant={view === "compose" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("compose")}
            >
              <Plus className="mr-1.5 size-3.5" />
              New Message
            </Button>
          </div>

          {view === "compose" && (
            <Card>
              <CardHeader>
                <CardTitle>New Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSend} className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">To</label>
                    <select
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      value={composeReceiver}
                      onChange={(e) => setComposeReceiver(e.target.value)}
                      required
                    >
                      <option value="">Select a user...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Subject</label>
                    <input
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Message</label>
                    <textarea
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[120px]"
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSending}>
                    {isSending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Send className="mr-1.5 size-3.5" />}
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {view === "detail" && selectedMessage && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startReply(selectedMessage)}>
                      <Reply className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(selectedMessage.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  From <strong>{selectedMessage.sender.name}</strong> &lt;{selectedMessage.sender.email}&gt;
                  {" · "}
                  {new Date(selectedMessage.created_at).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedMessage.body}
                </div>
              </CardContent>
            </Card>
          )}

          {["inbox", "sent"].includes(view) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {view === "inbox" ? <Inbox className="size-5" /> : <Send className="size-5" />}
                  <CardTitle>{view === "inbox" ? "Inbox" : "Sent Messages"}</CardTitle>
                </div>
                <CardDescription>
                  {view === "inbox" ? "Messages from other users" : "Messages you've sent"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                  </div>
                ) : !messages || messages.data.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {view === "inbox" ? "No messages yet." : "No sent messages."}
                  </p>
                ) : (
                  <>
                    <div className="space-y-1">
                      {(view === "inbox" ? messages?.data ?? [] : sentMessages?.data ?? []).map((msg) => (
                        <div
                          key={msg.id}
                          className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => openDetail(msg)}
                        >
                          <div className={`mt-0.5 ${msg.read_at ? "text-muted-foreground" : "text-primary"}`}>
                            <Mail className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm truncate ${!msg.read_at && view === "inbox" ? "font-bold" : ""}`}>
                                {msg.subject}
                              </p>
                              {!msg.read_at && view === "inbox" && (
                                <span className="size-1.5 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {view === "inbox"
                                ? `From: ${msg.sender.name}`
                                : `To: ${msg.receiver.name}`}
                              {" · "}
                              {new Date(msg.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Pagination */}
                    {(view === "inbox" ? messages && messages.last_page > 1 : sentMessages && sentMessages.last_page > 1) && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground">
                          {(view === "inbox" ? messages : sentMessages)!.total} total
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= (view === "inbox" ? messages : sentMessages)!.last_page}
                            onClick={() => setPage(page + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
