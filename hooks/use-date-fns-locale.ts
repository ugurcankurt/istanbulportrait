import { useState, useEffect } from "react";
import type { Locale } from "date-fns";
import { useLocale } from "next-intl";
import { enUS } from "date-fns/locale/en-US";

export function useDateFnsLocale() {
  const locale = useLocale();
  const [dateFnsLocale, setDateFnsLocale] = useState<Locale>(enUS);

  useEffect(() => {
    let isMounted = true;

    const loadLocale = async () => {
      let loc;
      try {
        switch (locale) {
          case "ar":
            loc = (await import("date-fns/locale/ar")).ar;
            break;
          case "es":
            loc = (await import("date-fns/locale/es")).es;
            break;
          case "ru":
            loc = (await import("date-fns/locale/ru")).ru;
            break;
          case "fr":
            loc = (await import("date-fns/locale/fr")).fr;
            break;
          case "de":
            loc = (await import("date-fns/locale/de")).de;
            break;
          case "zh":
            loc = (await import("date-fns/locale/zh-CN")).zhCN;
            break;
          case "ro":
            loc = (await import("date-fns/locale/ro")).ro;
            break;
          case "tr":
            loc = (await import("date-fns/locale/tr")).tr;
            break;
          default:
            loc = (await import("date-fns/locale/en-US")).enUS;
            break;
        }
        if (isMounted && loc) {
          setDateFnsLocale(loc);
        }
      } catch (error) {
        console.error("Failed to load date-fns locale:", error);
      }
    };

    loadLocale();

    return () => {
      isMounted = false;
    };
  }, [locale]);

  return dateFnsLocale;
}
