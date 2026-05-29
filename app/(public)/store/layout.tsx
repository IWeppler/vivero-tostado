import { Navbar } from "@/shared/components/navbar";
import { CartSidebar } from "@/shared/components/cart-sidebar";
import { createClient } from "@/shared/config/supabase/server";
import { ConfiguracionPOS } from "@/entities/config/types";
import { cookies } from "next/headers";

export const metadata = {
  title: "Tienda Oficial | Vivero Tostado",
  description: "Encuentra la planta que buscás.",
};

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: settings } = await supabase
    .from("configuracion_pos")
    .select("*")
    .limit(1)
    .single();

  const systemBranding: ConfiguracionPOS = {
    id: "1",
    posName: settings?.posName || "LVEM",
    posLogo: settings?.posLogo || "/lvem.jpg",
    whatsapp: settings?.whatsapp || "",
    direccion: settings?.direccion || "",
    mensaje_ticket: settings?.mensaje_ticket || "",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar branding={systemBranding} />
      <CartSidebar numeroWhatsApp={systemBranding.whatsapp} />
      {children}

      {/* FOOTER BÁSICO */}
      <footer className="bg-neutral-900 border-t border-border py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-neutral-400">
          © {new Date().getFullYear()} {systemBranding.posName} Todos los
          derechos reservados.
        </div>
      </footer>
    </div>
  );
}
