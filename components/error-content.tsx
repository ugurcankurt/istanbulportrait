"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/routing";

interface ErrorContentProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorContent({ error, reset }: ErrorContentProps) {
  const t = useTranslations("error");

  return (
    <div className="container flex items-center justify-center min-h-[80vh] px-4 py-12">
      <Card className="w-full max-w-md border-2 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </CardHeader>
        <CardContent className="text-center pb-6">
          <div className="bg-muted/50 rounded-lg p-4 text-xs font-mono text-muted-foreground break-all">
            {error.digest && <p className="mb-1">Error ID: {error.digest}</p>}
            {process.env.NODE_ENV === "development" && (
              <p className="mt-2 text-destructive">{error.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="w-full sm:w-auto gap-2">
            <RefreshCw className="w-4 h-4" />
            {t("retry")}
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              {t("home")}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
