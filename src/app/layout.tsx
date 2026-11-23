import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/Toaster";
import "./globals.css";

const display = localFont({
  src: [
    {
      path: "../fonts/CormorantGaramond-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/CormorantGaramond-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/CormorantGaramond-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

const body = localFont({
  src: [
    {
      path: "../fonts/OpenSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/OpenSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/OpenSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/OpenSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RDP Gestión",
  description: "Gestión interna de asuntos — Rojas & De Paz Abogados S.A.S.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/brand/favicon.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CO">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
