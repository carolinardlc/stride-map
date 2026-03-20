import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StrideMap",
  description: "StrideMap - 15-Minute City Planning System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
