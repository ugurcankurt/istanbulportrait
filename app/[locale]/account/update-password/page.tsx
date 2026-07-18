"use client";

import { useState, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

export default function UpdatePasswordPage() {
  const t = useTranslations("account.updatePassword");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"loading" | "authenticated" | "missing">("loading");
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    // Check if user is actually authenticated (session is securely set via cookies by our /api/auth/confirm route)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setSessionStatus("missing");
      } else {
        setSessionStatus("authenticated");
      }
    };
    
    checkSession();
  }, [supabase.auth]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      router.push("/account/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/60 backdrop-blur-xl">
        <CardHeader className="space-y-3 text-center pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight">{t("title")}</CardTitle>
          <CardDescription className="text-base">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                <AlertDescription className="font-medium text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {sessionStatus === "missing" && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive mb-4">
                <AlertDescription className="font-medium text-sm">
                  Authentication session is missing! The invite link may have expired or is invalid. Please try logging in or contact support.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="password">{t("newPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t("newPasswordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-background/50"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 bg-background/50"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading || !password || !confirmPassword || sessionStatus === "missing"}>
              {loading ? (
                <>
                  <Spinner className="w-4 h-4 mr-2 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("savePassword")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
