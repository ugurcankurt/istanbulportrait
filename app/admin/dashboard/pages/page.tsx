"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { pagesContentService, type PageDB } from "@/lib/pages-content-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const PAGE_CONFIGS = [
  { slug: "home", type: "Page", label: "Home Page" },
  { slug: "home-hero", type: "Section", label: "Home Base - Hero Area" },
  { slug: "home-portfolio", type: "Section", label: "Home Base - Portfolio Gallery" },
  { slug: "home-packages", type: "Section", label: "Home Base - Packages Intro" },
  { slug: "home-instagram", type: "Section", label: "Home Base - Instagram Feed" },
  { slug: "home-faq", type: "Section", label: "Home Base - FAQ" },
  { slug: "home-reviews", type: "Section", label: "Home Base - Reviews" },
  { slug: "about", type: "Page", label: "About Page" },
  { slug: "packages", type: "Page", label: "Packages List Page" },
  { slug: "locations", type: "Page", label: "Locations List Page" },
  { slug: "contact", type: "Page", label: "Contact Page" },
  { slug: "blog", type: "Page", label: "Blog Index Page" },
  { slug: "privacy", type: "Page", label: "Privacy Policy" },
];

export default function PagesAdminPage() {
  const [pages, setPages] = useState<PageDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const dbData = await pagesContentService.getAllPages();

      // Merge DB data with PAGE_CONFIGS
      const mergedPages = PAGE_CONFIGS.map(config => {
        const existing = dbData.find(p => p.slug === config.slug);

        const base = existing || {
          id: "",
          slug: config.slug,
          title: {},
          subtitle: {},
          is_active: false,
          created_at: "",
          updated_at: ""
        } as PageDB;

        // Return a hybrid object for rendering to attach the label/type
        return { ...base, _config: config };
      });

      setPages(mergedPages as any);
    } catch (error) {
      toast.error("Failed to fetch pages");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pages Core Content</h1>
          <p className="text-muted-foreground">
            Manage titles and subtitles for core public pages (About, Privacy, etc).
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>All Configured Pages</CardTitle>
          <CardDescription>A list of all static routes managed via CMS.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slug (Route)</TableHead>
                <TableHead>Title (EN)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
                      Loading pages...
                    </div>
                  </TableCell>
                </TableRow>
              ) : pages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No pages configured yet. Create one!
                  </TableCell>
                </TableRow>
              ) : (
                pages.map((page: any) => (
                  <TableRow key={page.slug}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">{page._config.label}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {page._config.type}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">/{page.slug}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {page.id ? (page.title?.en || <span className="text-muted-foreground italic">No English Title</span>) : <span className="text-muted-foreground italic">Not configured</span>}
                    </TableCell>
                    <TableCell>
                      {page.id && page.is_active ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="w-3 h-3" /> {page.id ? "Inactive" : "Needs Setup"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          asChild
                        >
                          <Link href={`/admin/dashboard/pages/${page.slug}`}>
                            <Pencil className="w-4 h-4" />
                            <span>{page.id ? "Edit" : "Setup Page"}</span>
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
