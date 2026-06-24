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
import { Plus, Edit, Trash2, Tag, Loader2 } from "lucide-react";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "@/lib/blog-api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");

  const loadCategories = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor("#6366f1");
    setEditingId(null);
  };

  const handleEdit = (cat: Category) => {
    setName(cat.name);
    setDescription(cat.description || "");
    setColor(cat.color || "#6366f1");
    setEditingId(cat.id);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      if (editingId) {
        const updated = await updateCategory(editingId, { name: name.trim(), description: description.trim() || null, color });
        setCategories((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
      } else {
        const created = await createCategory({ name: name.trim(), description: description.trim() || null, color });
        setCategories((prev) => [...prev, created]);
      }
      resetForm();
    } catch {
      // handle error
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
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
                  <BreadcrumbPage>Categories</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex-1 p-4 pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
            {/* List */}
            <Card>
              <CardHeader>
                <CardTitle>All Categories</CardTitle>
                <CardDescription>Manage your content categories</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 rounded-md" />
                    ))}
                  </div>
                ) : categories.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <Tag className="mb-2 size-8" />
                    <p className="text-sm">No categories yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-block size-3 rounded-full"
                            style={{ backgroundColor: cat.color || "#6366f1" }}
                          />
                          <div>
                            <p className="text-sm font-medium">{cat.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {cat.posts_count || 0} posts
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-xs" onClick={() => handleEdit(cat)}>
                            <Edit className="size-3" />
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(cat.id)}>
                            <Trash2 className="size-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle>{editingId ? "Edit Category" : "New Category"}</CardTitle>
                <CardDescription>
                  {editingId ? "Update the category details" : "Add a new category for posts"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    className="mt-1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Category name"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <textarea
                    className="mt-1 w-full min-h-[60px] rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-9 w-12 rounded-md border border-input bg-transparent p-0.5 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground">{color}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
                    {isSaving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Plus className="mr-1.5 size-4" />}
                    {editingId ? "Update" : "Create"}
                  </Button>
                  {editingId && (
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
