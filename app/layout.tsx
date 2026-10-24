import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Think First — AI Tutor",
  description: "An AI tutor that makes you understand, not just copy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
