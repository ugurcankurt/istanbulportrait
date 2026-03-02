import "@/app/globals.css";
import { NotFoundContent } from "@/components/not-found-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Page Not Found | Istanbul Portrait",
  description: "The page you are looking for does not exist.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootNotFound() {
  return (
    <html lang="en">
      <body>
        <NotFoundContent
          locale="en"
          title="Page Not Found"
          subtitle="Oops! This photography session seems to be missing"
          description="The page you're looking for doesn't exist. Perhaps you'd like to explore our photography packages or return home to discover the beauty of Istanbul photography."
          homeButton="Return Home"
          packagesButton="View Packages"
          goBack="Go Back"
        />
      </body>
    </html>
  );
}
