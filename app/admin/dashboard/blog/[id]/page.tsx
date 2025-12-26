"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { BlogForm } from "@/components/admin/blog/blog-form";
import { Button } from "@/components/ui/button";
import { useBlogStore } from "@/stores/blog-store";
import type { BlogFormData, BlogPostWithAllTranslations } from "@/types/blog";

export default function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { currentPost, fetchPostById, updatePost } = useBlogStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      setIsLoading(true);
      try {
        await fetchPostById(id);
      } catch (error) {
        console.error("Error loading post:", error);
        toast.error("Failed to load blog post");
        router.push("/admin/dashboard/blog");
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [id, fetchPostById, router]);

  const handleSubmit = async (data: BlogFormData) => {
    setIsSubmitting(true);
    try {
      const success = await updatePost(id, data);
      if (success) {
        toast.success("Blog post updated successfully!");
        router.push("/admin/dashboard/blog");
      } else {
        toast.error("Failed to update blog post");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("An error occurred while updating the post");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Blog post not found</p>
          <Button asChild>
            <Link href="/admin/dashboard/blog">Back to Posts</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard/blog">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Posts
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Post</h1>
          <p className="text-muted-foreground">
            {(currentPost as unknown as BlogPostWithAllTranslations)
              .translations?.en?.title ||
              (currentPost as unknown as BlogPostWithAllTranslations)
                .translations?.ar?.title ||
              (currentPost as unknown as BlogPostWithAllTranslations)
                .translations?.ru?.title ||
              (currentPost as unknown as BlogPostWithAllTranslations)
                .translations?.es?.title ||
              (currentPost as unknown as BlogPostWithAllTranslations)
                .translations?.fr?.title ||
              "Untitled Post"}
          </p>
        </div>
      </div>

      {/* Form */}
      <BlogForm
        initialData={currentPost}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
