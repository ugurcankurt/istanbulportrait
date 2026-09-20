import { notFound } from "next/navigation";
import { AddonForm } from "@/components/admin/addons/addon-form";
import { supabaseAdmin } from "@/lib/supabase";

export default async function EditAddonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const { data: addon, error } = await supabaseAdmin
    .from("addons")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !addon) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Add-on</h1>
        <p className="text-muted-foreground">
          Update pricing and translations for {addon.title?.en || addon.slug}.
        </p>
      </div>

      <AddonForm initialData={addon} />
    </div>
  );
}
