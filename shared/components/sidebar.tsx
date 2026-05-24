"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/features/auth/actions/logout";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Settings2,
  Wallet,
} from "lucide-react";
import { useState, useMemo } from "react";
import { ConfiguracionPOS } from "@/entities/config/types";
import { CartButton } from "@/shared/ui/cart-button"; // <-- Importamos el carrito

const ALL_NAV_ITEMS = [
  { name: "Inicio", href: "/", icon: LayoutDashboard, adminOnly: true },
  { name: "Caja y Movimientos", href: "/caja", icon: Wallet, adminOnly: true },
  { name: "Inventario", href: "/stock", icon: Package, adminOnly: false },
  { name: "Ventas", href: "/ventas", icon: ShoppingCart, adminOnly: false },
  {
    name: "Configuración",
    href: "/configuracion",
    icon: Settings2,
    adminOnly: true,
  },
];

interface SidebarProps {
  branding: ConfiguracionPOS;
  userRole: string;
}

export function Sidebar({ branding, userRole }: Readonly<SidebarProps>) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const initial = branding.posName
    ? branding.posName.charAt(0).toUpperCase()
    : "S";

  const visibleNavItems = useMemo(() => {
    return ALL_NAV_ITEMS.filter((item) => {
      if (item.adminOnly && userRole !== "ADMIN") {
        return false;
      }
      return true;
    });
  }, [userRole]);

  return (
    <>
      {/* MOBILE TOP NAVBAR (Solo visible en celular) */}
      <div className="md:hidden flex w-full shrink-0 items-center justify-between px-4 h-16 bg-white border-b border-border sticky top-0 z-50">
        <Link
          href={userRole === "ADMIN" ? "/" : "/stock"}
          className="flex items-center gap-3 overflow-hidden"
        >
          <div className="w-9 h-9 flex items-center justify-center rounded-lg overflow-hidden border border-border bg-white shrink-0">
            {branding.posLogo ? (
              <Image
                src={branding.posLogo}
                alt={`Logo ${branding.posName}`}
                width={36}
                height={36}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="font-bold text-lg text-muted-foreground">
                {initial}
              </span>
            )}
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight truncate">
            {branding.posName}
          </span>
        </Link>

        {/* Contenedor de Acciones en Mobile: Carrito + Menú */}
        <div className="flex items-center gap-1">
          <CartButton />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors cursor-pointer shrink-0"
            aria-label="Alternar menú"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* OVERLAY OSCURO */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 top-16 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
        fixed md:sticky top-16 md:top-0 left-0 h-[calc(100vh-64px)] md:h-screen w-full md:w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}
      >
        {/* BRANDING DESKTOP */}
        <div className="hidden md:flex p-6 items-center gap-3 border-b border-gray-100">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl overflow-hidden border border-gray-100 bg-white shrink-0">
            {branding.posLogo ? (
              <Image
                src={branding.posLogo}
                alt={`Logo ${branding.posName}`}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="font-bold text-xl text-muted-foreground">
                {initial}
              </span>
            )}
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">
            {branding.posName}
          </span>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${
                  isActive
                    ? "bg-neutral-200 text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-neutral-900" : "text-neutral-400"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER / LOGOUT */}
        <div className="p-4 border-t border-gray-100">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2.5 text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer font-medium"
            >
              <LogOut className="w-5 h-5 text-red-500" />
              Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
