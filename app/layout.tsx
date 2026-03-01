import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chat App",
  description: "Real-time chat application with Next.js and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
