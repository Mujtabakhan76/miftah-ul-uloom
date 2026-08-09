import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "مفتاح العلوم | اسلامی ڈیجیٹل کتب خانہ",
  description:
    "مفتاح العلوم — عربی اور اردو اسلامی کتب کے مطالعہ، تلاش اور تحقیق کے لیے ایک جدید ڈیجیٹل لائبریری۔ Miftah-ul-Uloom: an Islamic digital library and research platform for Arabic and Urdu books.",
  openGraph: {
    title: "مفتاح العلوم | Miftah-ul-Uloom",
    description: "اسلامی ڈیجیٹل کتب خانہ — عربی و اردو کتب کی تلاش اور مطالعہ۔",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ur" dir="rtl" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
