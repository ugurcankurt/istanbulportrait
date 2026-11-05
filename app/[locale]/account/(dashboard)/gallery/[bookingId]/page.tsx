import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import ClientGallery from "@/components/gallery/client-gallery";
import { Button } from "@/components/ui/button";
import { Link, redirect } from "@/i18n/routing";
import { getServerUser } from "@/lib/auth-server";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const [user, locale, resolvedParams, t] = await Promise.all([
    getServerUser(),
    getLocale(),
    params,
    getTranslations("account.gallery"),
  ]);

  if (!user) {
    redirect({ href: "/account/login", locale });
    return null;
  }

  return (
    <div className="space-y-6">
      <Link href="/account/dashboard">
        <Button
          variant="ghost"
          className="-ml-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("backToDashboard")}
        </Button>
      </Link>

      <ClientGallery bookingId={resolvedParams.bookingId} />
    </div>
  );
}
