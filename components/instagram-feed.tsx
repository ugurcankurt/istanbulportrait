"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Instagram, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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

export function InstagramFeed() {
    const t = useTranslations("packages");
    const tui = useTranslations("ui");
    const [posts, setPosts] = useState<BeholdPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                    // Filter out videos and reels, only keep images and carousels
                    const filteredPosts = data.posts.filter((post: BeholdPost) =>
                        post.mediaType === "IMAGE" || post.mediaType === "CAROUSEL_ALBUM"
                    );
                    setPosts(filteredPosts.slice(0, 6)); // Ensure we only ever show exactly 6
                }
            } catch (err: any) {
                setError(err.message || "Instagram akışı yüklenemedi.");
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();
    }, []);

    return (
        <section className="py-10 sm:py-16 bg-muted/10 border-y border-border/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Instagram className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
                        Follow on Instagram
                    </h2>
                    <a
                        href="https://instagram.com/istanbulportrait"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg text-primary hover:text-primary/80 transition-colors font-medium flex items-center justify-center gap-1"
                    >
                        @istanbulportrait
                    </a>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 max-w-5xl mx-auto">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-destructive/10 border border-destructive/20 rounded-xl max-w-2xl mx-auto text-center gap-4">
                        <AlertCircle className="h-10 w-10 text-destructive" />
                        <div>
                            <h3 className="text-lg font-semibold text-destructive mb-1">API Bağlantısı Eksik</h3>
                            <p className="text-sm text-balance text-muted-foreground">{error}</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 max-w-5xl mx-auto">
                        {posts.map((post, i) => (
                            <a
                                key={post.id}
                                href={post.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block aspect-square overflow-hidden rounded-xl bg-muted"
                            >
                                <Image
                                    src={
                                        post.mediaType === "VIDEO" && post.thumbnailUrl
                                            ? post.thumbnailUrl
                                            : (post.sizes?.large?.mediaUrl || post.mediaUrl)
                                    }
                                    alt={post.caption?.slice(0, 100) || "Instagram post from @istanbulportrait"}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    sizes="(max-width: 768px) 50vw, 33vw"
                                    unoptimized // External images from Instagram graph API might block next/image optimizations without config
                                    priority={i < 2}
                                    loading={i < 2 ? "eager" : "lazy"}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                                    <Instagram className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-8 w-8" />
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                <div className="mt-10 text-center">
                    <Button asChild variant="outline" className="rounded-full px-8">
                        <a href="https://instagram.com/istanbulportrait" target="_blank" rel="noopener noreferrer">
                            Visit Profile
                        </a>
                    </Button>
                </div>
            </div>
        </section>
    );
}
