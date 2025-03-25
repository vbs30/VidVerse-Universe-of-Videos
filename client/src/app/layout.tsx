import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import { ThemeProvider } from "@/components/ui/theme-provider"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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

const categories: string[] = [
  "Music",
  "Gaming",
  "Vlogs",
  "Cooking & Food",
  "Technology",
  "AI & Machine Learning",
  "Education",
  "Science & Space",
  "Movies & TV Reviews",
  "Sports & Fitness",
  "Travel & Adventure",
  "DIY & Crafts",
  "Business & Finance",
  "News & Politics",
  "Health & Wellness",
  "Comedy & Entertainment",
  "Beauty & Fashion",
  "Motivation & Self-improvement",
  "Photography & Videography",
  "Cars & Automobiles",
];

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
            {/* Fixed width sidebar */}
            <SidebarProvider>
              <Dashboard />

              {/* Main content area */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Category header */}
                <header className="sticky top-0 flex h-16 shrink-0 items-center border-b bg-background px-4 z-10">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <div className="w-full overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 pb-2">
                      {categories.map((category, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="whitespace-nowrap flex-shrink-0"
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                </header>

                {/* Scrollable content area */}
                <main className="flex-1 overflow-y-auto p-4">
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
}