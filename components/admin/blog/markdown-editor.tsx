"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";

// Import styles
import "easymde/dist/easymde.min.css";

// Dynamic import to avoid SSR issues with EasyMDE
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-muted animate-pulse rounded-md" />
  ),
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your content in Markdown...",
  minHeight = "400px",
}: MarkdownEditorProps) {
  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorInstanceRef = useRef<any>(null);

  // Custom image upload handler
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const toastId = toast.loading("Converting and uploading image...");

        const { createClientSupabaseClient } = await import(
          "@/lib/supabase/client"
        );
        const supabase = createClientSupabaseClient();

        // Convert to WebP
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context failed");
        ctx.drawImage(img, 0, 0);

        const webpBlob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/webp", 0.8),
        );

        if (!webpBlob) throw new Error("WebP conversion failed");

        const fileName = `${Date.now()}-${file.name.split(".")[0]}.webp`;
        const { error: uploadError } = await supabase.storage
          .from("blog-images")
          .upload(fileName, webpBlob, {
            contentType: "image/webp",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("blog-images").getPublicUrl(fileName);

        const imageMarkdown = `\n![${file.name.split(".")[0]}](${publicUrl})\n`;
        
        if (editorInstanceRef.current) {
          const cm = editorInstanceRef.current.codemirror;
          cm.replaceSelection(imageMarkdown);
        } else {
          onChange((value || "") + imageMarkdown);
        }

        toast.dismiss(toastId);
        toast.success("Image uploaded and appended to content!");
      } catch (error: any) {
        console.error("Upload failed", error);
        toast.dismiss();
        toast.error(error.message || "Failed to upload image");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [value, onChange],
  );

  const options = useMemo(() => {
    return {
      spellChecker: false,
      placeholder: placeholder,
      minHeight: minHeight,
      // toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image", "|", "preview", "side-by-side", "fullscreen"],
      toolbar: [
        "bold",
        "italic",
        "heading",
        "|",
        "quote",
        "unordered-list",
        "ordered-list",
        "|",
        "link",
        {
          name: "custom-image",
          action: (editor: any) => {
            // Store editor instance to insert at cursor later
            editorInstanceRef.current = editor;
            // Trigger file input click
            fileInputRef.current?.click();
          },
          className: "fa fa-picture-o",
          title: "Upload Image",
        },
        "|",
        "preview",
        "side-by-side",
        "fullscreen",
        "guide",
      ],
      status: ["autosave", "lines", "words", "cursor"],
    } as any;
  }, [placeholder, minHeight]);

  return (
    <div className="prose-editor-wrapper">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
      <SimpleMDE
        value={value}
        onChange={onChange}
        options={options}
        className="text-base"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
}
