import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get messages for error pages - provide fallback empty object
  let messages: any;
  try {
    messages = await getMessages();
  } catch (_error) {
    // Fallback messages for error pages
    messages = {
      notfound: {
        title: "Page Not Found",
        subtitle: "Oops! This photography session seems to be missing",
        description: "The page you're looking for doesn't exist.",
        homeButton: "Return Home",
        packagesButton: "View Packages",
        goBack: "Go Back",
      },
    };
  }

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
