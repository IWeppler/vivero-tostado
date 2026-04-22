import { Navbar } from "@/shared/components/navbar";
import { CartSidebar } from "@/features/store/components/cart-sidebar";

export const metadata = {
  title: "Tienda Oficial | Ninja Camisetas",
  description: "Encuentra la camiseta de tu equipo.",
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const NUMERO_WHATSAPP = "5491137920744";

  return (
    <div className="min-h-screen bg-[#fffefe] flex flex-col">
      <Navbar />
      <CartSidebar numeroWhatsApp={NUMERO_WHATSAPP} />
      {children}

      {/* FOOTER BÁSICO */}
      <footer className="bg-neutral-900 border-t border-border py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-neutral-400">
          © {new Date().getFullYear()} Ninja Camisetas. Todos los derechos
          reservados.
        </div>
      </footer>
    </div>
  );
}
