import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WildChats",
  description: "Real-time chat application with Next.js and Supabase",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: '/wildcats-logo.svg',
    apple: '/wildcats-logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
