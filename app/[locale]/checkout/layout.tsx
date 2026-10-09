/**
 * Checkout layout — pass-through only.
 * Navigation, Footer and WhatsApp are hidden by the
 * CheckoutForm component itself using fixed z-[9999] overlay.
 */
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
