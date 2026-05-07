import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Nav from "@/components/Nav";
import FooterDisclaimer from "@/components/FooterDisclaimer";

export const metadata: Metadata = {
  title: "AI 国学生活顾问",
  description: "基于传统历法、民俗文化、空间环境建议与心理学框架的生活参考报告平台。所有内容仅供文化与生活规划参考。",
  robots: { index: false } // MVP 阶段不参与搜索引擎索引
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>
        <FooterDisclaimer />
        <Analytics />
      </body>
    </html>
  );
}
