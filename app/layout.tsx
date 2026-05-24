import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/shared/ui/sonner";
import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase
    .from("configuracion_pos")
    .select("posName")
    .limit(1)
    .single();

  const posName = data?.posName;

  return {
    title: `${posName} | Gestión POS`,
    description: "Sistema de gestión y punto de venta web",
    appleWebApp: {
      capable: true,
      title: posName,
      statusBarStyle: "black-translucent",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`h-full antialiased`}>
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
