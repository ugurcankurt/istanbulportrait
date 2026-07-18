"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export function NewsletterSection() {
  const t = useTranslations("ui");
  const locale = useLocale();
  // Some inline fallback translations just in case they are missing in the user's locales
  const getTrans = (key: string, fallback: string) => {
    try { return t(key); } catch { return fallback; }
  };

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstName, lastName, email, locale }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setIsSuccess(true);
      toast.success(getTrans("newsletter_success", "You've successfully subscribed. Check your email for your promo code!"));
      setEmail("");
    } catch (error: any) {
      toast.error(error.message || getTrans("newsletter_error", "An error occurred. Please try again later."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative py-16 sm:py-24">
      <div className="container relative z-10 px-4 max-w-5xl mx-auto">
        <Card className="relative overflow-hidden border-border bg-card/50 backdrop-blur-sm shadow-sm">
          {/* Subtle glowing accents */}
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-72 h-72 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-72 h-72 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

          <CardContent className="p-8 sm:p-12 md:p-16 relative z-10">
            <div className="text-center mb-10 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5" />
                {getTrans("newsletter_badge", "Special Offer")}
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                {getTrans("newsletter_title", "Get Your Exclusive Promo Code")}
              </h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                {getTrans("newsletter_subtitle", "Subscribe to our newsletter to receive an instant discount code for your next photoshoot, plus seasonal updates and early access to new packages.")}
              </p>
            </div>

            <div className="max-w-xl mx-auto">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-primary/5 border border-primary/20 rounded-2xl animate-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{getTrans("newsletter_success_title", "You're on the list!")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {getTrans("newsletter_success_desc", "We just sent your promo code to your inbox. Enjoy your discount!")}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                      type="text"
                      placeholder={getTrans("newsletter_first_name", "First Name")}
                      className="h-14 rounded-xl bg-background border-border shadow-sm text-base flex-1 focus-visible:ring-primary/50 transition-all"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <Input
                      type="text"
                      placeholder={getTrans("newsletter_last_name", "Last Name")}
                      className="h-14 rounded-xl bg-background border-border shadow-sm text-base flex-1 focus-visible:ring-primary/50 transition-all"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Input
                        type="email"
                        placeholder={getTrans("newsletter_placeholder", "Enter your email address...")}
                        className="pl-11 h-14 rounded-xl bg-background border-border shadow-sm text-base focus-visible:ring-primary/50 transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="h-14 rounded-xl px-8 font-semibold shrink-0 sm:w-auto w-full shadow-sm"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          {getTrans("newsletter_button", "Subscribe Now")}
                          <ArrowRight className="w-4 h-4 ml-2 rtl:rotate-180" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              <p className="text-center text-xs text-muted-foreground mt-6">
                {getTrans("newsletter_disclaimer", "By subscribing, you agree to receive marketing emails. You can unsubscribe at any time.")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
