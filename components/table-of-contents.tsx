"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { generateSlugFromTitle } from "@/lib/slug-generator";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  title?: string;
}

export function TableOfContents({ content, title = "Table of Contents" }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Basic regex to find markdown headings (## and ###)
    const headings = Array.from(content.matchAll(/^(#{2,3})\s+(.+)$/gm));
    
    // Check if we need to use github-slugger. 
    // rehype-slug uses github-slugger, which handles duplicates. 
    // For simplicity, we assume unique headings or simple slug generation.
    const counts: Record<string, number> = {};
    
    const tocItems = headings.map(match => {
      const level = match[1].length;
      const text = match[2].trim();
      let id = generateSlugFromTitle(text);
      
      // Handle duplicates similar to github-slugger
      if (counts[id]) {
        counts[id]++;
        id = `${id}-${counts[id]}`;
      } else {
        counts[id] = 0;
      }

      return {
        level,
        text,
        id
      };
    });

    setItems(tocItems);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="bg-muted/30 border-[0.5px] border-border/50 rounded-[2rem] p-6 mb-10 max-w-sm">
      <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">{title}</h3>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li 
            key={`${item.id}-${index}`}
            style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}
          >
            <NextLink 
              href={`#${item.id}`}
              className={`text-sm transition-colors hover:text-primary ${
                activeId === item.id 
                  ? "text-primary font-semibold" 
                  : "text-muted-foreground"
              }`}
            >
              {item.text}
            </NextLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
