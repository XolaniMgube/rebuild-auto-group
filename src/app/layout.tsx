import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rebuild Auto Group",
  applicationName: "Rebuild Auto Group",
  appleWebApp: { capable: true, title: "RAG", statusBarStyle: "default" },
  description: "Find parts, organise your car projects, and plan the next rebuild.",
};

export const viewport: Viewport = {
  themeColor: "#F5F7FA",
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
