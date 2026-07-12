import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
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
  title: "BioFarm - Farmacia en Cochabamba | Salud y bienestar para tu familia",
  description:
    "BioFarm es tu farmacia de confianza en Zona Sur, Cochabamba. Medicamentos, entrega a domicilio, control de presión, atención de emergencias y más.",
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
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
