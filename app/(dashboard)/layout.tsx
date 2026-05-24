import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/shared/components/sidebar";
import { CartSidebar } from "@/shared/components/cart-sidebar";
import { DashboardNavbar } from "@/shared/components/dashboard-navbar";
import { ConfiguracionPOS } from "@/entities/config/types";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth");
  }

  // 1. Obtenemos el Rol del usuario desde la tabla perfiles
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  const userRole = perfil?.rol || "VENDEDOR"; // Asumimos vendedor si no hay perfil

  // 2. Obtenemos el Branding
  const { data: settings } = await supabase
    .from("configuracion_pos")
    .select("id, posName, posLogo")
    .limit(1)
    .single();

  const systemBranding: ConfiguracionPOS = {
    id: settings?.id || "1",
    posName: settings?.posName || "Sistema POS",
    posLogo: settings?.posLogo || "",
    whatsapp: "",
    direccion: "",
    mensaje_ticket: "",
  };

  // 3. Renderizamos el Layout seguro
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* 1. Navegación Lateral  */}
      <Sidebar branding={systemBranding} userRole={userRole} />

      {/* Contenedor principal de la derecha */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 2. Cabecera superior exclusiva del POS */}
        <DashboardNavbar />

        {/* Contenido dinámico de las páginas (Ej: StockView) */}
        <main className="flex-1 p-2 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      <CartSidebar />
    </div>
  );
}
