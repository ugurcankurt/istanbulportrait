import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

interface BlogSummaryProps {
  summary: string;
}

export function BlogSummary({ summary }: BlogSummaryProps) {
  const t = useTranslations("blog.summary");

  if (!summary) return null;

  return (
    <div className="my-8 rounded-xl border bg-primary/5 p-6 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-4 text-primary font-semibold">
          <Sparkles className="w-5 h-5" />
          <h3>{t("title")}</h3>
        </div>

        <div className="text-lg leading-relaxed text-foreground/90 font-medium">
          {summary}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
          {t("ai_overview")}
        </div>
      </div>
    </div>
  );
}
