import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Hash, Loader2 } from "lucide-react";
import {
  fetchTags,
  createTag,
  updateTag,
  deleteTag,
  type Tag,
} from "@/lib/blog-api";

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [editName, setEditName] = useState("");

  const loadTags = async () => {
    try {
      const tgs = await fetchTags();
      setTags(tgs);
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const resetForm = () => {
    setName("");
    setEditingId(null);
    setEditName("");
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const created = await createTag({ name: name.trim() });
      setTags((prev) => [...prev, created]);
      setName("");
    } catch {
      // handle error
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const updated = await updateTag(id, { name: editName.trim() });
      setTags((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingId(null);
      setEditName("");
    } catch {
      // handle error
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this tag?")) return;
    try {
      await deleteTag(id);
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // handle error
    }
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
                  <BreadcrumbPage>Tags</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex-1 p-4 pt-0 max-w-2xl">
          <div className="grid grid-cols-1 gap-6">
            {/* Create */}
            <Card>
              <CardHeader>
                <CardTitle>Create Tag</CardTitle>
                <CardDescription>Add a new tag for organizing posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Tag Name</Label>
                    <Input
                      className="mt-1"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. technology"
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    />
                  </div>
                  <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
                    {isSaving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Plus className="mr-1.5 size-4" />}
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* List */}
            <Card>
              <CardHeader>
                <CardTitle>All Tags</CardTitle>
                <CardDescription>{tags.length} tag{tags.length !== 1 ? "s" : ""}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 rounded-md" />
                    ))}
                  </div>
                ) : tags.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <Hash className="mb-2 size-8" />
                    <p className="text-sm">No tags yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) =>
                      editingId === tag.id ? (
                        <div key={tag.id} className="flex items-center gap-1.5 rounded-md border p-1">
                          <Input
                            className="h-7 w-32 text-xs"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleUpdate(tag.id)}
                            autoFocus
                          />
                          <Button variant="ghost" size="icon-xs" onClick={() => handleUpdate(tag.id)}>
                            <Plus className="size-3" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          key={tag.id}
                          className="group flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                        >
                          <Hash className="size-3" />
                          <span>{tag.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({tag.posts_count || 0})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(tag.id);
                              setEditName(tag.name);
                            }}
                            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tag.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="size-3 text-destructive" />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
