import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fundraising Command Center",
  description: "Live fundraising tracker for fund managers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
