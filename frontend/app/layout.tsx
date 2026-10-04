import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ComplyAI",
  description: "AI-assisted compliance analysis, remediation and what-if simulation",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0f] text-white">{children}</body>
    </html>
  );
}
