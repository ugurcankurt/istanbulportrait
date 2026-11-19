import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AccountRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
