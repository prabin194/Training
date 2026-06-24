import api from "@/lib/api";

export interface Post {
  id: number;
  user_id: number;
  title: string;
  slug: string;
  content: Record<string, unknown> | null;
  excerpt: string | null;
  status: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  featured_image_id: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  author: { id: number; name: string; email: string } | null;
  categories: Category[];
  tags: Tag[];
  featured_image: MediaItem | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  created_at: string;
  posts_count?: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  posts_count?: number;
}

export interface MediaItem {
  id: number;
  user_id: number;
  name: string;
  file_name: string;
  mime_type: string;
  size: number;
  url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Posts
export async function fetchPosts(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  author_id?: number;
  category_id?: number;
  search?: string;
}): Promise<PaginatedResponse<Post>> {
  const response = await api.get("/posts", { params });
  return response.data;
}

export async function fetchPost(id: number): Promise<Post> {
  const response = await api.get(`/posts/${id}`);
  return response.data.post;
}

export async function createPost(data: FormData | Record<string, unknown>): Promise<Post> {
  const response = await api.post("/posts", data, {
    headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
  return response.data.post;
}

export async function updatePost(id: number, data: FormData | Record<string, unknown>): Promise<Post> {
  let response;
  if (data instanceof FormData) {
    data.append("_method", "PUT");
    response = await api.post(`/posts/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } else {
    response = await api.put(`/posts/${id}`, data);
  }
  return response.data.post;
}

export async function deletePost(id: number): Promise<void> {
  await api.delete(`/posts/${id}`);
}

// Categories
export async function fetchCategories(): Promise<Category[]> {
  const response = await api.get("/categories");
  return response.data.categories;
}

export async function createCategory(data: Partial<Category>): Promise<Category> {
  const response = await api.post("/categories", data);
  return response.data.category;
}

export async function updateCategory(id: number, data: Partial<Category>): Promise<Category> {
  const response = await api.put(`/categories/${id}`, data);
  return response.data.category;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}

// Tags
export async function fetchTags(): Promise<Tag[]> {
  const response = await api.get("/tags");
  return response.data.tags;
}

export async function createTag(data: Partial<Tag>): Promise<Tag> {
  const response = await api.post("/tags", data);
  return response.data.tag;
}

export async function updateTag(id: number, data: Partial<Tag>): Promise<Tag> {
  const response = await api.put(`/tags/${id}`, data);
  return response.data.tag;
}

export async function deleteTag(id: number): Promise<void> {
  await api.delete(`/tags/${id}`);
}

// Media
export async function fetchMedia(params?: {
  page?: number;
  per_page?: number;
  mime_type?: string;
}): Promise<PaginatedResponse<MediaItem>> {
  const response = await api.get("/media", { params });
  return response.data;
}

export async function uploadMedia(file: File, altText?: string): Promise<MediaItem> {
  const formData = new FormData();
  formData.append("file", file);
  if (altText) formData.append("alt_text", altText);

  const response = await api.post("/media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.media;
}

export async function deleteMedia(id: number): Promise<void> {
  await api.delete(`/media/${id}`);
}

// Workflow / Review

export interface Transition {
  id: number;
  from_status: string;
  to_status: string;
  comment: string | null;
  user_name: string;
  created_at: string;
}

export async function submitForReview(id: number, comment?: string): Promise<Post> {
  const response = await api.post(`/posts/${id}/submit-review`, { comment });
  return response.data.post;
}

export async function approvePost(id: number, comment?: string): Promise<Post> {
  const response = await api.post(`/posts/${id}/approve`, { comment });
  return response.data.post;
}

export async function rejectPost(id: number, comment: string): Promise<Post> {
  const response = await api.post(`/posts/${id}/reject`, { comment });
  return response.data.post;
}

export async function publishPost(id: number): Promise<Post> {
  const response = await api.post(`/posts/${id}/publish`);
  return response.data.post;
}

export async function fetchPendingReviews(params?: {
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<Post>> {
  const response = await api.get("/posts/review/pending", { params });
  return response.data;
}

export async function fetchTransitions(id: number): Promise<Transition[]> {
  const response = await api.get(`/posts/${id}/transitions`);
  return response.data.transitions;
}

export async function fetchAllowedTransitions(id: number): Promise<string[]> {
  const response = await api.get(`/posts/${id}/allowed-transitions`);
  return response.data.allowed_transitions;
}

// Admin - Users

export interface UserItem {
  id: number;
  uid: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export async function fetchUsers(params?: {
  page?: number;
}): Promise<PaginatedResponse<UserItem>> {
  const response = await api.get("/users", { params });
  return response.data;
}

export async function updateUserRole(id: number, role: string): Promise<UserItem> {
  const response = await api.put(`/users/${id}/role`, { role });
  return response.data.user;
}
