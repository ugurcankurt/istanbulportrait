"use client";

import { NotFoundContent } from "@/components/not-found-content";

export default function RootNotFound() {
  return (
    <NotFoundContent
      locale="en"
      title="Page Not Found"
      subtitle="Oops! This photography session seems to be missing"
      description="The page you're looking for doesn't exist. Perhaps you'd like to explore our photography packages or return home to discover the beauty of Istanbul photography."
      homeButton="Return Home"
      packagesButton="View Packages"
      goBack="Go Back"
    />
  );
}
