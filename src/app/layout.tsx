import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Rwanda Digital Driver & Vehicle Document Portal | Rwanda Drive",
  description: "Secure, mobile-first digital portal for Rwandan driving licences, Carte Jaune logbooks, motor insurance, and roadworthiness inspection certificates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-[#0e1e38]">
        {children}
      </body>
    </html>
  );
}
