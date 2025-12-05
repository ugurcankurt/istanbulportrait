import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  BlogCategoryWithTranslation,
  BlogFilters,
  BlogPostWithRelations,
  BlogTagWithTranslation,
  Locale,
} from "@/types/blog";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BlogState {
  // Data state
  posts: BlogPostWithRelations[];
  categories: BlogCategoryWithTranslation[];
  tags: BlogTagWithTranslation[];
  currentPost: BlogPostWithRelations | null;
  pagination: Pagination;
  loading: boolean;
  error: string | null;

  // Filter state
  filters: BlogFilters;

  // Actions - Posts
  fetchPosts: (
    params?: Partial<BlogFilters & { page?: number }>,
  ) => Promise<void>;
  fetchPostById: (id: string, locale?: Locale) => Promise<void>;
  createPost: (data: any) => Promise<boolean>;
  updatePost: (id: string, data: any) => Promise<boolean>;
  deletePost: (id: string) => Promise<boolean>;

  // Actions - Categories
  fetchCategories: (locale?: Locale) => Promise<void>;
  createCategory: (data: any) => Promise<boolean>;
  updateCategory: (id: string, data: any) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;

  // Actions - Tags
  fetchTags: (locale?: Locale) => Promise<void>;
  createTag: (data: any) => Promise<boolean>;
  updateTag: (id: string, data: any) => Promise<boolean>;
  deleteTag: (id: string) => Promise<boolean>;

  // Filter actions
  setFilters: (filters: Partial<BlogFilters>) => void;
  setPage: (page: number) => void;
  clearError: () => void;
  reset: () => void;
}

const initialFilters: BlogFilters = {
  search: "",
  status: "all",
  category_id: "all",
  tag_id: "all",
  locale: "en",
  is_featured: "all",
  sort_by: "created_at",
  sort_order: "desc",
};

const initialPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export const useBlogStore = create<BlogState>()(
  devtools(
    (set, get) => ({
      // Initial state
      posts: [],
      categories: [],
      tags: [],
      currentPost: null,
      pagination: initialPagination,
      loading: false,
      error: null,
      filters: initialFilters,

      // Fetch posts with filtering
      fetchPosts: async (params = {}) => {
        set({ loading: true, error: null });

        const currentState = get();
        const filters = { ...currentState.filters, ...params };
        const page = params.page ?? currentState.pagination.page;

        try {
          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: currentState.pagination.limit.toString(),
            sort_by: filters.sort_by,
            sort_order: filters.sort_order,
            locale: filters.locale,
          });

          if (filters.search) queryParams.set("search", filters.search);
          if (filters.status !== "all")
            queryParams.set("status", filters.status);
          if (filters.category_id !== "all")
            queryParams.set("category_id", filters.category_id);
          if (filters.tag_id !== "all")
            queryParams.set("tag_id", filters.tag_id);
          if (filters.is_featured !== "all")
            queryParams.set("is_featured", String(filters.is_featured));

          const response = await fetch(`/api/admin/blog?${queryParams}`);

          if (!response.ok) {
            throw new Error(`API Error ${response.status}`);
          }

          const data = await response.json();

          set({
            posts: data.posts || [],
            pagination: data.pagination || { ...initialPagination, page },
            filters,
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error("Blog Store: Fetch error:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch blog posts";

          set({
            posts: [],
            pagination: { ...initialPagination, page },
            loading: false,
            error: errorMessage,
          });
        }
      },

      // Fetch single post by ID
      fetchPostById: async (id: string, locale: Locale = "en") => {
        set({ loading: true, error: null });

        try {
          const response = await fetch(
            `/api/admin/blog/${id}?locale=${locale}`,
          );

          if (!response.ok) {
            throw new Error("Post not found");
          }

          const data = await response.json();

          set({
            currentPost: data.post,
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error("Blog Store: Fetch post error:", error);
          set({
            currentPost: null,
            loading: false,
            error:
              error instanceof Error ? error.message : "Failed to fetch post",
          });
        }
      },

      // Create post
      createPost: async (postData: any) => {
        set({ loading: true, error: null });

        try {
          const response = await fetch("/api/admin/blog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create post");
          }

          const data = await response.json();

          set({ loading: false, error: null });

          // Refresh posts list
          await get().fetchPosts();

          return true;
        } catch (error) {
          console.error("Blog Store: Create error:", error);
          set({
            loading: false,
            error:
              error instanceof Error ? error.message : "Failed to create post",
          });
          return false;
        }
      },

      // Update post
      updatePost: async (id: string, postData: any) => {
        set({ loading: true, error: null });

        try {
          const response = await fetch(`/api/admin/blog/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update post");
          }

          set({ loading: false, error: null });

          // Refresh posts list
          await get().fetchPosts();

          return true;
        } catch (error) {
          console.error("Blog Store: Update error:", error);
          set({
            loading: false,
            error:
              error instanceof Error ? error.message : "Failed to update post",
          });
          return false;
        }
      },

      // Delete post
      deletePost: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await fetch(`/api/admin/blog/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete post");
          }

          set({ loading: false, error: null });

          // Refresh posts list
          await get().fetchPosts();

          return true;
        } catch (error) {
          console.error("Blog Store: Delete error:", error);
          set({
            loading: false,
            error:
              error instanceof Error ? error.message : "Failed to delete post",
          });
          return false;
        }
      },

      // Fetch categories
      fetchCategories: async (locale: Locale = "en") => {
        try {
          const response = await fetch(
            `/api/admin/blog-categories?locale=${locale}`,
          );

          if (!response.ok) {
            throw new Error("Failed to fetch categories");
          }

          const data = await response.json();

          set({ categories: data.categories || [] });
        } catch (error) {
          console.error("Blog Store: Fetch categories error:", error);
          set({ categories: [] });
        }
      },

      // Create category
      createCategory: async (categoryData: any) => {
        try {
          const response = await fetch("/api/admin/blog-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(categoryData),
          });

          if (!response.ok) {
            throw new Error("Failed to create category");
          }

          // Refresh categories
          await get().fetchCategories(get().filters.locale);

          return true;
        } catch (error) {
          console.error("Blog Store: Create category error:", error);
          return false;
        }
      },

      // Update category
      updateCategory: async (id: string, categoryData: any) => {
        try {
          const response = await fetch(`/api/admin/blog-categories/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(categoryData),
          });

          if (!response.ok) {
            throw new Error("Failed to update category");
          }

          // Refresh categories
          await get().fetchCategories(get().filters.locale);

          return true;
        } catch (error) {
          console.error("Blog Store: Update category error:", error);
          return false;
        }
      },

      // Delete category
      deleteCategory: async (id: string) => {
        try {
          const response = await fetch(`/api/admin/blog-categories/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete category");
          }

          // Refresh categories
          await get().fetchCategories(get().filters.locale);

          return true;
        } catch (error) {
          console.error("Blog Store: Delete category error:", error);
          return false;
        }
      },

      // Fetch tags
      fetchTags: async (locale: Locale = "en") => {
        try {
          const response = await fetch(`/api/admin/blog-tags?locale=${locale}`);

          if (!response.ok) {
            throw new Error("Failed to fetch tags");
          }

          const data = await response.json();

          set({ tags: data.tags || [] });
        } catch (error) {
          console.error("Blog Store: Fetch tags error:", error);
          set({ tags: [] });
        }
      },

      // Create tag
      createTag: async (tagData: any) => {
        try {
          const response = await fetch("/api/admin/blog-tags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tagData),
          });

          if (!response.ok) {
            throw new Error("Failed to create tag");
          }

          // Refresh tags
          await get().fetchTags(get().filters.locale);

          return true;
        } catch (error) {
          console.error("Blog Store: Create tag error:", error);
          return false;
        }
      },

      // Update tag
      updateTag: async (id: string, tagData: any) => {
        try {
          const response = await fetch(`/api/admin/blog-tags/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tagData),
          });

          if (!response.ok) {
            throw new Error("Failed to update tag");
          }

          // Refresh tags
          await get().fetchTags(get().filters.locale);

          return true;
        } catch (error) {
          console.error("Blog Store: Update tag error:", error);
          return false;
        }
      },

      // Delete tag
      deleteTag: async (id: string) => {
        try {
          const response = await fetch(`/api/admin/blog-tags/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete tag");
          }

          // Refresh tags
          await get().fetchTags(get().filters.locale);

          return true;
        } catch (error) {
          console.error("Blog Store: Delete tag error:", error);
          return false;
        }
      },

      // Set filters and trigger fetch
      setFilters: (newFilters: Partial<BlogFilters>) => {
        const currentState = get();
        const updatedFilters = { ...currentState.filters, ...newFilters };

        set({
          filters: updatedFilters,
          pagination: { ...currentState.pagination, page: 1 },
        });

        get().fetchPosts();
      },

      // Set page and trigger fetch
      setPage: (page: number) => {
        const currentState = get();

        set({
          pagination: { ...currentState.pagination, page },
        });

        get().fetchPosts({ page });
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },

      // Reset store to initial state
      reset: () => {
        set({
          posts: [],
          categories: [],
          tags: [],
          currentPost: null,
          pagination: initialPagination,
          loading: false,
          error: null,
          filters: initialFilters,
        });
      },
    }),
    {
      name: "blog-store",
    },
  ),
);
