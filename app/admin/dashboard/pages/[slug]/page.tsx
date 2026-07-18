import { pagesContentService } from "@/lib/pages-content-service";
import { PageForm } from "@/components/admin/pages/page-form";



interface EditPageAdminProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EditPageAdmin({ params }: EditPageAdminProps) {
  const { slug } = await params;

  const allPages = await pagesContentService.getAllPages();
  let pageRecord = allPages.find((p) => p.slug === slug);

  if (!pageRecord) {
    // Inject a skeleton for PageForm to treat as an existing initial entity ready to be created.
    pageRecord = {
      id: "",       // Marks it as a 'create' operation implicitly in page-form but we must handle it well.
      slug: slug,
      title: {},
      subtitle: {},
      is_active: true,
      created_at: "",
      updated_at: "",
    } as any;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Page Content</h1>
        <p className="text-muted-foreground">
          Update the localized titles and subtitles for /{slug}.
        </p>
      </div>

      <PageForm initialData={pageRecord as any} />
    </div>
  );
}
