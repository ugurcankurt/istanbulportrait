"use client";

import {
  Bold,
  Code,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
} from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length,
      );
    }, 0);
  };

  const toolbar = [
    {
      icon: Bold,
      label: "Bold",
      action: () => insertMarkdown("**", "**"),
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => insertMarkdown("*", "*"),
    },
    {
      icon: Code,
      label: "Code",
      action: () => insertMarkdown("`", "`"),
    },
    {
      icon: Link2,
      label: "Link",
      action: () => insertMarkdown("[", "](url)"),
    },
    {
      icon: Image,
      label: "Image",
      action: () => insertMarkdown("![alt](", ")"),
    },
    {
      icon: List,
      label: "Bullet List",
      action: () => insertMarkdown("\n- ", ""),
    },
    {
      icon: ListOrdered,
      label: "Numbered List",
      action: () => insertMarkdown("\n1. ", ""),
    },
  ];

  return (
    <div className="border rounded-lg">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
        {toolbar.map((tool) => (
          <Button
            key={tool.label}
            type="button"
            variant="ghost"
            size="sm"
            onClick={tool.action}
            title={tool.label}
          >
            <tool.icon className="w-4 h-4" />
          </Button>
        ))}
        <div className="ml-auto">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          >
            <TabsList className="h-8">
              <TabsTrigger value="edit" className="text-xs">
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content Area */}
      <Tabs value={activeTab} className="w-full">
        <TabsContent value="edit" className="m-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[400px] border-0 rounded-none resize-none focus-visible:ring-0"
            style={{ minHeight }}
          />
        </TabsContent>
        <TabsContent value="preview" className="m-0">
          <div
            className="prose prose-sm dark:prose-invert max-w-none p-4 overflow-auto"
            style={{ minHeight }}
          >
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">
                Nothing to preview. Start writing to see the preview.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Helper Text */}
      <div className="p-2 border-t bg-muted/30 text-xs text-muted-foreground">
        Supports{" "}
        <a
          href="https://www.markdownguide.org/basic-syntax/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          Markdown syntax
        </a>{" "}
        with GitHub Flavored Markdown extensions
      </div>
    </div>
  );
}
