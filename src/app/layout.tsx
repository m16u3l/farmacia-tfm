import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import { CronInitializer } from "@/components/CronInitializer";
import moment from "moment";
import "moment/locale/es";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configure moment.js
moment.locale("es");

export const metadata: Metadata = {
  title: "BioFarm - Farmacia y Salud",
  description: "Sistema de gestión para farmacia BioFarm",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeRegistry>
          <CronInitializer />
          <ResponsiveLayout>
            {children}
          </ResponsiveLayout>
        </ThemeRegistry>
      </body>
    </html>
  );
}
