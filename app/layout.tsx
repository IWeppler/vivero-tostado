import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/shared/ui/sonner";

export const metadata: Metadata = {
  title: "Ninja Camisetas | Sistema de Gestión",
  description: "Aplicación para el control de ventas de camisetas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
