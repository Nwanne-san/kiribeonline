import type { Metadata } from "next";
import { Open_Sans, Outfit } from "next/font/google";
import { GoogleAnalytics } from "@/modules/shared/components/GoogleAnalytics";
import Providers from "./providers";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-headline",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kiribe Online",
    template: "%s | Kiribe Online",
  },
  description:
    "Premium editorial and entertainment — film, television, opinion, news, and spotlight features.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${openSans.variable} antialiased`}>
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
