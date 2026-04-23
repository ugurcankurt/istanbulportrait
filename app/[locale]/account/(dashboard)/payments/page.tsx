import { getServerUser } from "@/lib/auth-server";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { Receipt, CheckCircle, Clock, CreditCard as CardIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function CustomerPaymentsPage() {
  const user = await getServerUser();
  const t = await getTranslations("account.payments");
  const tSuccess = await getTranslations("success");
  if (!user) {
    redirect("/account/login");
  }

  const supabase = await createServerSupabaseAdminClient();

  // Fetch bookings to get the associated payments
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id,
      package_id,
      total_amount,
      status,
      payments (
        id,
        amount,
        currency,
        status,
        provider,
        created_at
      )
    `)
    .or(`user_id.eq."${user.id}"${user.email ? `,user_email.eq."${user.email}"` : ''}`)
    .order("created_at", { ascending: false });



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
              <Receipt className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t("noTransactions")}</h3>
            <p className="text-muted-foreground max-w-md">{t("noRecords")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {bookings.map((booking: any) => {
            const successfulPayments = booking.payments?.filter((p: any) => 
              ['success', 'completed', 'paid'].includes(p.status?.toLowerCase())
            ) || [];
            const totalPaid = successfulPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
            const remainingBalance = Math.max(0, Number(booking.total_amount) - totalPaid);

            return (
              <Card key={booking.id} className="overflow-hidden rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-primary/5 to-transparent p-6 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <Badge variant="outline" className="mb-2 bg-background">
                      {booking.package_id.replace(/-/g, ' ')}
                    </Badge>
                    <p className="text-sm font-medium text-muted-foreground">
                      Booking ID: <span className="font-mono text-foreground/80">{booking.id.split('_').pop() || booking.id}</span>
                    </p>
                  </div>
                  
                  <div className="w-full md:w-auto flex flex-row items-center gap-6 bg-background p-4 rounded-xl border border-border/50">
                    <div className="flex-1 md:flex-none">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t("totalAmount")}</p>
                      <p className="text-xl font-bold">{formatCurrency(booking.total_amount, "EUR")}</p>
                    </div>
                    <div className="w-px h-10 bg-border"></div>
                    
                    <div className="flex-1 md:flex-none">
                      <p className="text-xs text-emerald-500 uppercase tracking-wider font-semibold mb-1">{tSuccess("amount_paid")}</p>
                      <p className="text-xl font-bold text-emerald-500">{formatCurrency(totalPaid, "EUR")}</p>
                    </div>
                    
                    <div className="w-px h-10 bg-border"></div>

                    <div className="flex-1 md:flex-none">
                      <p className="text-xs text-amber-500 uppercase tracking-wider font-semibold mb-1">{t("balanceDue")}</p>
                      <p className="text-xl font-bold text-amber-500">{formatCurrency(remainingBalance, "EUR")}</p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-0">
                  {booking.payments && booking.payments.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {booking.payments.map((payment: any) => (
                        <div key={payment.id} className="p-5 flex justify-between items-center bg-card hover:bg-muted/30 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-xl ${['success', 'completed', 'paid'].includes(payment.status?.toLowerCase()) ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                              {['success', 'completed', 'paid'].includes(payment.status?.toLowerCase()) ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground flex items-center gap-2">
                                <CardIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="capitalize">{payment.provider} Payment</span>
                              </p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {new Date(payment.created_at).toLocaleString("en-US", {
                                  month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{formatCurrency(payment.amount, payment.currency)}</p>
                            <Badge variant={['success', 'completed', 'paid'].includes(payment.status?.toLowerCase()) ? 'secondary' : 'outline'} className={['success', 'completed', 'paid'].includes(payment.status?.toLowerCase()) ? 'bg-emerald-500/10 text-emerald-600 mt-1' : 'mt-1 capitalize'}>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center justify-center">
                      <div className="bg-muted p-4 rounded-full mb-4">
                        <Clock className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">{t("noRecords")}</p>
                      <p className="text-sm text-muted-foreground mt-1">Payments are typically processed at the time of booking or in person.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
