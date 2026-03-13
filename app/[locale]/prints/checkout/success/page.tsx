import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, MapPin, Package, Home, ShoppingBag } from "lucide-react";
import { Link } from "@/i18n/routing";

interface SuccessPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ orderId?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout.success" });
  return {
    title: `${t("title")} | Istanbul Portrait`,
    robots: { index: false, follow: true }
  };
}

export default async function PrintSuccessPage({ params, searchParams }: SuccessPageProps) {
  const { locale } = await params;
  const { orderId } = await searchParams;
  const t = await getTranslations({ locale, namespace: "prints" });
  const tui = await getTranslations({ locale, namespace: "ui" });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <BreadcrumbNav />
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-24 max-w-3xl">
        <div className="animate-scale-in">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-8 border-b">
              <div className="mx-auto mb-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold mb-4">{t("success_title")}</CardTitle>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                {t("success_message")}
              </p>
            </CardHeader>

            <CardContent className="pt-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-muted/30 rounded-xl p-6 border flex items-start gap-4">
                  <div className="p-3 bg-background rounded-lg shadow-sm">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">{t("order_id")}</h3>
                    <p className="font-mono text-lg font-bold tracking-tight">#{orderId?.slice(-8).toUpperCase() || "SUCCESS"}</p>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-6 border flex items-start gap-4">
                  <div className="p-3 bg-background rounded-lg shadow-sm">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">{t("confirmation_email")}</h3>
                    <p className="text-sm text-muted-foreground">{t("email_description")}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 flex items-start gap-4">
                <div className="p-3 bg-blue-100/50 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">{t("delivery_status")}</h3>
                  <p className="text-blue-700 text-sm">
                    {t("delivery_description")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild className="flex-1 h-12 text-base font-semibold shadow-md">
                  <Link href="/prints" className="flex items-center justify-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    {t("back_to_shop")}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 h-12 text-base font-semibold hover:bg-muted/80">
                  <Link href="/" className="flex items-center justify-center gap-2">
                    <Home className="w-5 h-5" />
                    {tui("back_to_home")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
