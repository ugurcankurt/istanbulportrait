import { getServerUser } from "@/lib/auth-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { Calendar, Clock, Image as ImageIcon, CheckCircle, Package, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

export default async function CustomerDashboardPage() {
  const user = await getServerUser();
  const t = await getTranslations("account.dashboard");
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  
  // Fetch bookings belonging to this user
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .or(`user_id.eq."${user.id}"${user.email ? `,user_email.eq."${user.email}"` : ''}`)
    .order("booking_date", { ascending: false });

  return (
    <div className="space-y-10">
      <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl">
            {t("description")}
          </p>
        </div>
      </div>

      {(!bookings || bookings.length === 0) ? (
        <Card className="border-dashed bg-muted/20 border-2">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-primary/10 p-6 rounded-full mb-6">
              <Calendar className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t("noReservations")}</h3>
            <p className="text-muted-foreground max-w-md">{t("noReservationsDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking: any) => {
            const date = new Date(booking.booking_date);
            const isUpcoming = date > new Date();

            return (
              <Card key={booking.id} className="group overflow-hidden flex flex-col rounded-2xl border-border/50 bg-card hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
                <div className="bg-gradient-to-br from-primary/5 to-transparent p-5 border-b border-border/50 relative">
                  <div className="mt-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                      {booking.package_id.replace(/-/g, ' ')}
                    </p>
                    <h3 className="text-xl font-bold tracking-tight">
                      {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </h3>
                  </div>
                </div>
                
                <CardContent className="p-5 flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary/30 p-2.5 rounded-lg flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      <span className="text-sm font-medium">{booking.booking_time}</span>
                    </div>
                    <div className="bg-secondary/30 p-2.5 rounded-lg flex items-center">
                      <Package className="w-4 h-4 mr-2 text-primary" />
                      <span className="text-sm font-medium">{booking.people_count} {t("people")}</span>
                    </div>
                  </div>
                  
                  <div className="pt-1 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t("totalAmount")}</p>
                      <p className="text-lg font-bold">{formatCurrency(booking.total_amount, "EUR")}</p>
                    </div>
                  </div>
                </CardContent>
                
                <div className="p-5 pt-0 mt-auto">
                  {booking.drive_folder_id ? (
                    <Link href={{ pathname: '/account/gallery/[bookingId]', params: { bookingId: booking.id } }}>
                      <Button className="w-full rounded-lg h-10 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all group-hover:shadow-md">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        {t("viewGallery")}
                        <ArrowRight className="w-4 h-4 ml-auto opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full rounded-lg h-10" variant="outline" disabled>
                      <Clock className="w-4 h-4 mr-2 animate-pulse" />
                      {t("photosProcessing")}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
