import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar/Navbar";
import AddTicketModal from "./components/modals/AddTicketModal";
import DetailModal from "./components/modals/DetailModal";
import ReportsModal from "./components/modals/ReportsModal";
import ResolutionModal from "./components/modals/ResolutionModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FLUX Ticketing System",
  description: "Internal Ticketing System",
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

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
        <div className="flex min-h-screen">
          <Navbar />

          {/* Main content */}
          <main className="flex-1 md:mt-0">
            {children}

            <AddTicketModal />
            <DetailModal />
            <ReportsModal />            
          </main>
        </div>
      </body>
    </html>
  );
}
