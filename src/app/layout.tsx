import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://potexia.my.id"),
  title: {
    default: "POTEXIA | Solusi Jaringan & Teknologi untuk Bisnis",
    template: "%s | POTEXIA",
  },
  description: "POTEXIA menyediakan solusi jaringan, managed IT service, CCTV, aplikasi kasir, dan website untuk bisnis, hotel, sekolah, serta UMKM di Lombok dan Indonesia.",
  applicationName: "POTEXIA",
  keywords: [
    "jasa jaringan Lombok",
    "instalasi Wi-Fi bisnis",
    "managed IT service",
    "instalasi CCTV",
    "aplikasi kasir POS",
    "website UMKM",
    "POTEXIA",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://potexia.my.id",
    siteName: "POTEXIA",
    title: "POTEXIA | Solusi Jaringan & Teknologi untuk Bisnis",
    description: "Solusi jaringan, managed IT service, CCTV, aplikasi kasir, dan website yang disesuaikan untuk kebutuhan bisnis.",
    images: [
      {
        url: "/logo-transparent.png",
        width: 1615,
        height: 528,
        alt: "POTEXIA Data & Technology Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "POTEXIA | Solusi Jaringan & Teknologi untuk Bisnis",
    description: "Solusi jaringan, managed IT service, CCTV, aplikasi kasir, dan website untuk bisnis.",
    images: ["/logo-transparent.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/logo-transparent.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
