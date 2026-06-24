import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Save,
  Eye,
  ArrowLeft,
  Loader2,
  Image,
} from "lucide-react";
import TiptapEditor from "@/components/tiptap-editor";
import MediaLibraryModal from "@/components/media-library-modal";
import {
  fetchPost,
  createPost,
  updatePost,
  fetchCategories,
  fetchTags,
  type Category,
  type Tag,
  type Post,
  type MediaItem,
} from "@/lib/blog-api";

export default function PostCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState("draft");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [featuredImage, setFeaturedImage] = useState<MediaItem | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [cats, tgs] = await Promise.all([
        fetchCategories(),
        fetchTags(),
      ]);
      setCategories(cats);
      setTags(tgs);

      if (isEditing) {
        const post = await fetchPost(Number(id));
        setTitle(post.title);
        setContent(post.content ? JSON.stringify(post.content) : "");
        setExcerpt(post.excerpt || "");
        setStatus(post.status);
        setMetaTitle(post.meta_title || "");
        setMetaDescription(post.meta_description || "");
        setSelectedCategories(post.categories?.map((c) => c.id) || []);
        setSelectedTags(post.tags?.map((t) => t.id) || []);
        if (post.featured_image) {
          setFeaturedImage(post.featured_image);
        }
      }
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditing]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (publishStatus?: string) => {
    setIsSaving(true);
    try {
      const data: Record<string, unknown> = {
        title,
        content: content || null,
        excerpt: excerpt || null,
        status: publishStatus || status,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        featured_image_id: featuredImage?.id || null,
        category_ids: selectedCategories,
        tag_ids: selectedTags,
      };

      if (isEditing) {
        await updatePost(Number(id), data);
      } else {
        const post = await createPost(data);
        navigate(`/posts/${post.id}/edit`, { replace: true });
        return;
      }
    } catch {
      // handle error
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full py-20">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/posts">Posts</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{isEditing ? "Edit Post" : "New Post"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <Button variant="outline" onClick={() => navigate("/posts")}>
              <ArrowLeft className="mr-1.5 size-4" />
              Back
            </Button>
            {isEditing && status === "draft" && (
              <Button variant="secondary" onClick={() => handleSave("in_review")}>
                Submit for Review
              </Button>
            )}
            {isEditing && (status === "approved" || status === "draft") && (
              <Button onClick={() => handleSave("published")}>
                <Eye className="mr-1.5 size-4" />
                Publish
              </Button>
            )}
            <Button onClick={() => handleSave()} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 size-4" />
              )}
              Save
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 p-6">
            {/* Main Content */}
            <div className="space-y-6">
              <Input
                placeholder="Post title"
                className="h-12 text-2xl font-bold border-none shadow-none px-0 focus-visible:ring-0"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div>
                <Label className="mb-2 block text-sm font-medium">Content</Label>
                <TiptapEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Start writing your post..."
                />
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">Excerpt</Label>
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
                  placeholder="Brief excerpt of your post..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                </CardContent>
              </Card>

              {/* Featured Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Featured Image</CardTitle>
                </CardHeader>
                <CardContent>
                  {featuredImage ? (
                    <div className="relative aspect-video overflow-hidden rounded-md border bg-muted">
                      <img
                        src={featuredImage.url}
                        alt={featuredImage.alt_text || ""}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFeaturedImage(null)}
                        className="absolute top-1 right-1 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-foreground"
                      >
                        <span className="sr-only">Remove</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowMediaModal(true)}
                      className="flex aspect-video w-full items-center justify-center rounded-md border border-dashed text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Image className="size-6" />
                        <span className="text-xs">Choose Image</span>
                      </div>
                    </button>
                  )}
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  {categories.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No categories available.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {categories.map((cat) => (
                        <label
                          key={cat.id}
                          className="flex items-center gap-2 cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-input"
                            checked={selectedCategories.includes(cat.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories((prev) => [...prev, cat.id]);
                              } else {
                                setSelectedCategories((prev) =>
                                  prev.filter((id) => id !== cat.id)
                                );
                              }
                            }}
                          />
                          <span className="flex items-center gap-1.5">
                            {cat.color && (
                              <span
                                className="inline-block size-2.5 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                            )}
                            {cat.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  {tags.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No tags available.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => {
                        const isSelected = selectedTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTags((prev) => prev.filter((id) => id !== tag.id));
                              } else {
                                setSelectedTags((prev) => [...prev, tag.id]);
                              }
                            }}
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SEO */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">SEO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Meta Title</Label>
                    <Input
                      className="mt-1 h-8 text-sm"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="SEO title..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Meta Description</Label>
                    <textarea
                      className="mt-1 w-full min-h-[60px] rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Meta description..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <MediaLibraryModal
          open={showMediaModal}
          onOpenChange={setShowMediaModal}
          onSelect={(media) => {
            setFeaturedImage(media);
            setShowMediaModal(false);
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
