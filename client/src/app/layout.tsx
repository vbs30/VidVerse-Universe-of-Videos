import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import { ThemeProvider } from "@/components/ui/theme-provider"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

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
  "Motivation & Self-Improvement",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Navbar />
          <SidebarProvider>
            <main className="overflow-x-hidden">
              <SidebarProvider>
                <Dashboard />
                <SidebarInset>
                  <header className="sticky top-0 flex h-16 shrink-0 items-center border-b bg-background px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <div className="flex-1 overflow-x-auto scrollbar-hide">
                      <div className="flex gap-2 min-w-max">
                        {categories.map((category, index) => (
                          <Button key={index} variant="outline" className="whitespace-nowrap">
                            {category}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </header>
                  <div className="flex flex-1 flex-col gap-4 p-4">
                    <div className="grid auto-rows-min gap-4 md:grid-cols-5">
                      {children}
                    </div>
                  </div>
                </SidebarInset>
              </SidebarProvider>
            </main>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}