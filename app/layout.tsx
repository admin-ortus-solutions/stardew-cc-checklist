import type { Metadata } from "next";
import { Pixelify_Sans, VT323 } from "next/font/google";
import "./globals.css";

const pixelDisplay = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pixel",
  display: "swap",
});

const pixelBody = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stardew CC Checklist",
  description: "Shared Community Center bundle checklist for our co-op save.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${pixelDisplay.variable} ${pixelBody.variable}`}>
      <body>{children}</body>
    </html>
  );
}
