"use client";

import {
  Archive,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBlogDate } from "@/lib/blog/blog-utils";
import { useBlogStore } from "@/stores/blog-store";
import type { BlogPostWithRelations } from "@/types/blog";

function StatusBadge({ status }: { status: string }) {
  const config = {
    draft: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    published: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    archived: { color: "bg-gray-100 text-gray-800", icon: Archive },
  };

  const { color, icon: Icon } =
    config[status as keyof typeof config] || config.draft;

  return (
    <Badge variant="secondary" className={color}>
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function DeletePostDialog({
  post,
  onDelete,
}: {
  post: BlogPostWithRelations;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(post.id);
      toast.success("Post deleted successfully");
      setOpen(false);
    } catch (_error) {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        <div className="flex items-center w-full">
          <Trash className="w-4 h-4 mr-2" />
          Delete Post
        </div>
      </DropdownMenuItem>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Blog Post</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{post.translation.title}"? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BlogManagementPage() {
  const {
    posts,
    categories,
    tags,
    pagination,
    loading,
    error,
    filters,
    fetchPosts,
    fetchCategories,
    fetchTags,
    deletePost,
    setFilters,
    setPage,
    clearError,
  } = useBlogStore();

  const { search, status, category_id, tag_id, locale, sort_by, sort_order } =
    filters;

  // Fetch data on mount
  useEffect(() => {
    fetchPosts();
    fetchCategories(locale);
    fetchTags(locale);
  }, [fetchPosts, fetchCategories, fetchTags, locale]);

  // Show error as toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Debounced search
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== search) {
        setFilters({ search: searchInput });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput, search, setFilters]);

  const handleDeletePost = async (id: string) => {
    await deletePost(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">
            Manage blog posts, categories and tags
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/dashboard/blog/new">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search posts..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </InputGroup>
            </div>

            {/* Status Filter */}
            <Select
              value={status}
              onValueChange={(value) =>
                setFilters({ status: value as typeof status })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Locale Filter */}
            <Select
              value={locale}
              onValueChange={(value) =>
                setFilters({ locale: value as typeof locale })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
                <SelectItem value="ru">Russian</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select
              value={category_id}
              onValueChange={(value) => setFilters({ category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.translation?.name || cat.slug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tag Filter */}
            <Select
              value={tag_id}
              onValueChange={(value) => setFilters({ tag_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.translation?.name || tag.slug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select
              value={sort_by}
              onValueChange={(value) =>
                setFilters({ sort_by: value as typeof sort_by })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created Date</SelectItem>
                <SelectItem value="published_at">Published Date</SelectItem>
                <SelectItem value="views_count">Views</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select
              value={sort_order}
              onValueChange={(value) =>
                setFilters({ sort_order: value as typeof sort_order })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 mt-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/dashboard/blog/categories">
                Manage Categories
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/dashboard/blog/tags">Manage Tags</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Spinner className="size-8 mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">
                Loading posts...
              </p>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8">
              <Empty>
                <EmptyMedia variant="icon">
                  <Edit className="size-12" />
                </EmptyMedia>
                <EmptyTitle>No blog posts found</EmptyTitle>
                <EmptyDescription>
                  Start creating engaging content for your photography blog
                </EmptyDescription>
                <EmptyContent>
                  <Button asChild>
                    <Link href="/admin/dashboard/blog/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Post
                    </Link>
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="flex items-center gap-2">
                            {post.translation.title}
                            {post.is_featured && (
                              <Badge variant="default" className="text-xs">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {post.slug}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={post.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {post.categories?.slice(0, 2).map((cat) => (
                            <Badge
                              key={cat.category.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {cat.category.translation?.name ||
                                cat.category.slug}
                            </Badge>
                          ))}
                          {post.categories && post.categories.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.categories.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {post.published_at
                          ? formatBlogDate(post.published_at, locale)
                          : "Not published"}
                      </TableCell>
                      <TableCell>{post.views_count}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${locale}/blog/${post.slug}`}
                                target="_blank"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Post
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/dashboard/blog/${post.id}`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Post
                              </Link>
                            </DropdownMenuItem>
                            <DeletePostDialog
                              post={post}
                              onDelete={handleDeletePost}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t p-4">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} (
                    {pagination.total} total posts)
                  </div>
                  <ButtonGroup>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </ButtonGroup>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
