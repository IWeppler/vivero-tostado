import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/shared/components/sidebar";
import { CartSidebar } from "@/shared/components/cart-sidebar";
import { DashboardNavbar } from "@/shared/components/dashboard-navbar";

const NUMERO_WHATSAPP = process.env.NUMERO_WHATSAPP;

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* 1. Navegación Lateral  */}
      <Sidebar />

      {/* Contenedor principal de la derecha */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 2. Cabecera superior exclusiva del POS */}
        <DashboardNavbar />

        {/* Contenido dinámico de las páginas (Ej: StockView) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      <CartSidebar numeroWhatsApp={NUMERO_WHATSAPP} />
    </div>
  );
}
