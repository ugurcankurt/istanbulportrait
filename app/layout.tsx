import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export const metadata = {
  title: "The Istanbul Photographer",
  description: "We are a studio of English speaking photographers in Istanbul and our goal is to help you get amazing photos and videos.",
};

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
