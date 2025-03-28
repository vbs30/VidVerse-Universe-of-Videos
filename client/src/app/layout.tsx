import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import { ThemeProvider } from "@/components/ui/theme-provider"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VidVerse",
  description: "Video Streaming Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Navbar />
          <div className="flex h-[calc(100vh-64px)]">
            <SidebarProvider>
              <Dashboard />

              {/* Main content area */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Scrollable content area */}
                <main className="flex-1">
                  <div className="container mx-auto max-w-screen-2xl">
                    {children}
                    <Toaster position="bottom-left" richColors />
                  </div>
                </main>
              </div>
            </SidebarProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
};