import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { ToastProvider } from "@/components/providers/toast-provider";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stayhub - Find Your Perfect Rental Home",
  description: "Connect directly with property owners. No brokers, no hassle. Just simple, transparent rentals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
        <AppProviders>
          <AuthenticatedLayout>{children}</AuthenticatedLayout>
          <ToastProvider />
        </AppProviders>
      </body>
    </html>
  );
}
