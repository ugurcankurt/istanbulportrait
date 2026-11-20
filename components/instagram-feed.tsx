"use client";

import { RiInstagramLine as Instagram } from "@remixicon/react";
import { AlertCircle } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface BeholdPost {
  id: string;
  caption?: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  mediaUrl: string;
  permalink: string;
  thumbnailUrl?: string;
  timestamp: string;
  sizes?: {
    small?: { mediaUrl: string };
    medium?: { mediaUrl: string };
    large?: { mediaUrl: string };
    full?: { mediaUrl: string };
  };
}

interface InstagramFeedProps {
  header?: React.ReactNode;
  instagramUrl?: string;
}

export function InstagramFeed({ header, instagramUrl }: InstagramFeedProps) {
  const tui = useTranslations("ui");
  const [posts, setPosts] = useState<BeholdPost[]>([]);
  const [username, setUsername] = useState<string>(() => {
    if (instagramUrl) {
      const parsed = instagramUrl.replace(/\/$/, "").split("/").pop();
      return parsed || "";
    }
    return "";
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldPlayVideos, setShouldPlayVideos] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShouldPlayVideos(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldPlayVideos(true);
          observer.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/instagram");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch posts");
        }

        // Behold returns an object with a 'posts' array
        if (data && Array.isArray(data.posts)) {
          if (data.username) {
            setUsername(data.username);
          }
          // Allow images, carousels, and videos (Reels)
          const filteredPosts = data.posts.filter((post: BeholdPost) =>
            ["IMAGE", "CAROUSEL_ALBUM", "VIDEO"].includes(post.mediaType),
          );
          setPosts(filteredPosts.slice(0, 6)); // Ensure we only ever show exactly 6
        }
      } catch (err: any) {
        setError(err.message || tui("instagram_feed.error_msg"));
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [tui]);

  return (
    <section
      ref={sectionRef}
      className="py-10 sm:py-16 bg-muted/10 border-y border-border/50"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {header}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 bg-destructive/10 border border-destructive/20 rounded-xl max-w-2xl mx-auto text-center gap-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <h3 className="text-lg font-semibold text-destructive mb-1">
                {tui("instagram_feed.api_error")}
              </h3>
              <p className="text-sm text-balance text-muted-foreground">
                {error}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            {posts.map((post) => {
              const posterSrc =
                post.sizes?.large?.mediaUrl ||
                post.sizes?.medium?.mediaUrl ||
                post.thumbnailUrl ||
                post.mediaUrl;
              const postAlt =
                post.caption?.slice(0, 100) ||
                `Instagram post from @${username}`;

              return (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block aspect-square overflow-hidden rounded-xl bg-muted"
                >
                  {post.mediaType === "VIDEO" && shouldPlayVideos ? (
                    <video
                      src={post.mediaUrl}
                      poster={posterSrc}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <Image
                      src={posterSrc}
                      alt={postAlt}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 639px) 48vw, (max-width: 1023px) 31vw, 16vw"
                      quality={70}
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <Instagram className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-8 w-8" />
                  </div>
                </a>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <Button
            nativeButton={false}
            variant="outline"
            className="px-8"
            render={
              <a
                href={instagramUrl || `https://instagram.com/${username}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            {tui("instagram_feed.visit_profile")}
          </Button>
        </div>
      </div>
    </section>
  );
}
