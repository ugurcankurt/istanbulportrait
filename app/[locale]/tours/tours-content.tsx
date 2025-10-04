"use client";

import { motion } from "framer-motion";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { TourCardSkeleton } from "@/components/tour-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { GetYourGuideWidget } from "@/components/getyourguide-widget";
import { getPopularIstanbulTours, getFilteredTours, getToursByCategory, type TourCategory } from "@/lib/getyourguide";

interface ToursPageContentProps {
  locale: string;
}

type SortOption = "rating" | "price_asc" | "price_desc";
type CategoryFilter =
  | "all"
  | "historical"
  | "photography"
  | "food"
  | "cruises"
  | "walking"
  | "private"
  | "cultural"
  | "adventure";

// Static tour card removed - using GetYourGuide widgets only

export function ToursPageContent({ locale }: ToursPageContentProps) {
  const t = useTranslations("tours");
  const tui = useTranslations("ui");

  const [tourIds, setTourIds] = useState<string[]>([]);
  const [filteredTourIds, setFilteredTourIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Load all tour IDs initially
  useEffect(() => {
    const allTourIds = getPopularIstanbulTours(20);
    setTourIds(allTourIds);
    setFilteredTourIds(allTourIds);
  }, []);

  // Apply filters with real filtering logic
  useEffect(() => {
    let filtered = [...tourIds];

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = getToursByCategory(categoryFilter as TourCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = getFilteredTours(
        categoryFilter === "all" ? undefined : (categoryFilter as TourCategory),
        searchQuery
      );
    }

    // Note: Sorting by rating/price would require GetYourGuide API integration
    // For now, we maintain the current order

    setFilteredTourIds(filtered);
  }, [tourIds, searchQuery, sortBy, categoryFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setSortBy("rating");
  };

  const hasActiveFilters =
    searchQuery || categoryFilter !== "all" || sortBy !== "rating";

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Filter skeleton */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="h-10 w-64 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          <div className="flex gap-2">
            <div className="h-10 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-10 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>

        {/* Tours grid skeleton */}
        <div className="grid gap-4 sm:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <TourCardSkeleton key={`tour-skeleton-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
          <h3 className="text-lg font-medium text-red-900 dark:text-red-100">
            {t("errorTitle")}
          </h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            {tui("tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Filters and Search */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder") || "Search tours..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Desktop Filters */}
        <div className="hidden lg:flex lg:items-center lg:gap-4">
          <Select
            value={categoryFilter}
            onValueChange={(value: CategoryFilter) => setCategoryFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filters.category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("categories.all")}</SelectItem>
              <SelectItem value="historical">
                {t("categories.historical")}
              </SelectItem>
              <SelectItem value="cultural">
                {t("categories.cultural")}
              </SelectItem>
              <SelectItem value="adventure">
                {t("categories.adventure")}
              </SelectItem>
              <SelectItem value="cruises">{t("categories.cruises")}</SelectItem>
              <SelectItem value="private">{t("categories.private")}</SelectItem>
              <SelectItem value="photography">
                {t("categories.photography")}
              </SelectItem>
              <SelectItem value="food">{t("categories.food")}</SelectItem>
              <SelectItem value="walking">{t("categories.walking")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => setSortBy(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filters.sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">{t("filters.ratingDesc")}</SelectItem>
              <SelectItem value="price_asc">{t("filters.priceAsc")}</SelectItem>
              <SelectItem value="price_desc">
                {t("filters.priceDesc")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    !
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="p-6 pb-4 bg-muted/30">
                <div className="flex items-center justify-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Filter className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <SheetTitle className="text-lg font-semibold">
                      Filter Tours
                    </SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground mt-1">
                      Find exactly what you're looking for
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground mb-2">
                    Category
                  </div>
                  <Select
                    value={categoryFilter}
                    onValueChange={(value: CategoryFilter) =>
                      setCategoryFilter(value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("categories.all")}</SelectItem>
                      <SelectItem value="historical">
                        {t("categories.historical")}
                      </SelectItem>
                      <SelectItem value="cultural">
                        {t("categories.cultural")}
                      </SelectItem>
                      <SelectItem value="adventure">
                        {t("categories.adventure")}
                      </SelectItem>
                      <SelectItem value="cruises">
                        {t("categories.cruises")}
                      </SelectItem>
                      <SelectItem value="private">
                        {t("categories.private")}
                      </SelectItem>
                      <SelectItem value="photography">
                        {t("categories.photography")}
                      </SelectItem>
                      <SelectItem value="food">
                        {t("categories.food")}
                      </SelectItem>
                      <SelectItem value="walking">
                        {t("categories.walking")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground mb-2">
                    Sort By
                  </div>
                  <Select
                    value={sortBy}
                    onValueChange={(value: SortOption) => setSortBy(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select sort order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">
                        {t("filters.ratingDesc")}
                      </SelectItem>
                      <SelectItem value="price_asc">
                        {t("filters.priceAsc")}
                      </SelectItem>
                      <SelectItem value="price_desc">
                        {t("filters.priceDesc")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      {t("filters.clearFilters")}
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Active filters:
          </span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: "{searchQuery}"
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="ml-1 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </Badge>
          )}
          {categoryFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {t(`categories.${categoryFilter}`)}
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className="ml-1 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            {t("filters.clearFilters")}
          </Button>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredTourIds.length} tour
          {filteredTourIds.length !== 1 ? "s" : ""}
          {searchQuery && ` for "${searchQuery}"`}
        </div>
      </div>

      {/* Tours Grid - Widget Only */}
      {filteredTourIds.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 sm:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredTourIds.map((tourId, index) => (
            <motion.div
              key={tourId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <GetYourGuideWidget
                tourId={tourId}
                locale={locale}
                variant="vertical"
                className="min-h-[400px]"
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No tours found
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Try adjusting your search or filters to find more tours.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            {t("filters.clearFilters")}
          </Button>
        </div>
      )}
    </div>
  );
}
