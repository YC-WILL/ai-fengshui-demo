import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Nav from "@/components/Nav";
import FooterDisclaimer from "@/components/FooterDisclaimer";
import { brand } from "@/lib/config/brand";

export const metadata: Metadata = {
  title: `${brand.brandFullName} · ${brand.taglineZh}`,
  description: brand.seoDescription,
  robots: { index: false }, // MVP 阶段不参与搜索引擎索引
  applicationName: brand.brandFullName,
  openGraph: {
    title: `${brand.brandFullName} · ${brand.taglineZh}`,
    description: brand.seoDescription,
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8">{children}</main>
        <FooterDisclaimer />
        <Analytics />
      </body>
    </html>
  );
}
