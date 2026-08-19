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

export function generateMetadata(): Metadata {
  return {
    title: "Winnipeg Neighbourhood & Resource Map",
    description: "Verified community services, neighbourhood context, and private-by-design property lookup for Winnipeg.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "Winnipeg Neighbourhood & Resource Map",
      description: "Find the right support. Understand the neighbourhood.",
      type: "website",
      images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Winnipeg Neighbourhood and Resource Map" }],
    },
    twitter: { card: "summary_large_image", images: ["/og.png"] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
