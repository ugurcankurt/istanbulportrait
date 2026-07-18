import { getServerUser } from "@/lib/auth-server";
import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import ClientGallery from "@/components/gallery/client-gallery";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { getTranslations } from "next-intl/server";

export default async function GalleryPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const user = await getServerUser();
  const resolvedParams = await params;
  const t = await getTranslations("account.gallery");
  
  if (!user) {
    redirect("/account/login");
  }

  return (
    <div className="space-y-6">
      <Link href="/account/dashboard">
        <Button variant="ghost" className="-ml-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("backToDashboard")}
        </Button>
      </Link>
      
      <ClientGallery bookingId={resolvedParams.bookingId} />
    </div>
  );
}
