"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BlogForm } from "@/components/admin/blog/blog-form";
import { Button } from "@/components/ui/button";
import { useBlogStore } from "@/stores/blog-store";
import type { BlogFormData } from "@/types/blog";

export default function NewBlogPostPage() {
  const router = useRouter();
  const { createPost } = useBlogStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: BlogFormData) => {
    setIsSubmitting(true);
    try {
      const success = await createPost(data);
      if (success) {
        toast.success("Blog post created successfully!");
        router.push("/admin/dashboard/blog");
      } else {
        toast.error("Failed to create blog post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("An error occurred while creating the post");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Create New Post</h1>
          <p className="text-muted-foreground">
            Write and publish a new blog post
          </p>
        </div>
      </div>

      {/* Form */}
      <BlogForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
