"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PRINTS_CATEGORIES } from "@/lib/prodigi-shared";
import { cn } from "@/lib/utils";
import { 
    LayoutGrid, 
    FileImage, 
    Image as ImageIcon, 
    Sticker as StickerIcon, 
    Smartphone, 
    BookOpen, 
    Home, 
    Mail, 
    Trophy, 
    Shirt, 
    Watch, 
    Briefcase,
    Tag
} from "lucide-react";

// Icon mapping for premium feel
const ICON_MAP: Record<string, any> = {
    "all": LayoutGrid,
    "Prints & posters": FileImage,
    "Wall art": ImageIcon,
    "Stickers": StickerIcon,
    "Technology": Smartphone,
    "Books & magazines": BookOpen,
    "Home & living": Home,
    "Cards & stationery": Mail,
    "Sport & games": Trophy,
    "Men's clothing": Shirt,
    "Women's clothing": Shirt,
    "Kids' clothing": Shirt,
    "Accessories": Watch,
    "Business & commercial": Briefcase
};

export function CategoryFilter() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    const currentCategory = searchParams.get("category");

    const handleCategoryClick = (categoryId: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (categoryId) {
            params.set("category", categoryId);
        } else {
            params.delete("category");
        }
        // Also clear subcategory when category changes
        params.delete("subcategory");
        
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="relative w-full max-w-5xl mx-auto mb-12 px-2">
            <ScrollArea className="w-full whitespace-nowrap pb-4">
                <div className="flex w-max gap-3 p-1">
                    {/* All Products Item */}
                    <button
                        onClick={() => handleCategoryClick(null)}
                        className={cn(
                            "group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border-2",
                            !currentCategory 
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105" 
                                : "bg-background/50 hover:bg-muted border-transparent hover:border-primary/20 text-muted-foreground"
                        )}
                    >
                        <LayoutGrid className={cn("h-4 w-4 transition-transform group-hover:scale-110", !currentCategory ? "animate-pulse" : "")} />
                        <span>All Products</span>
                    </button>

                    {/* Dynamic Category Items */}
                    {PRINTS_CATEGORIES.map((cat) => {
                        const Icon = ICON_MAP[cat.label] || Tag;
                        const isActive = currentCategory === cat.label;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.label)}
                                className={cn(
                                    "group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border-2",
                                    isActive 
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105" 
                                        : "bg-background/50 hover:bg-muted border-transparent hover:border-primary/20 text-muted-foreground"
                                )}
                            >
                                <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "animate-pulse" : "")} />
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" className="h-1.5" />
            </ScrollArea>
        </div>
    );
}
