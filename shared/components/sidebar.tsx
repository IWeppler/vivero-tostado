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
  ChartArea,
} from "lucide-react";
import { useMemo } from "react";
import { ConfiguracionPOS } from "@/entities/config/types";
import { CartButton } from "@/shared/ui/cart-button";
import { useSidebarStore } from "@/shared/store/sidebar-store";

const ALL_NAV_ITEMS = [
  { name: "Inicio", href: "/", icon: LayoutDashboard, adminOnly: true },
  { name: "Caja y Movimientos", href: "/caja", icon: Wallet, adminOnly: true },
  { name: "Inventario", href: "/stock", icon: Package, adminOnly: false },
  { name: "Ventas", href: "/ventas", icon: ShoppingCart, adminOnly: false },
  { name: "Reportes", href: "/reportes", icon: ChartArea, adminOnly: true },
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
  const { isCollapsed, isOpenMobile, setIsOpenMobile } = useSidebarStore();

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
      <div className="md:hidden flex w-full shrink-0 items-center justify-between px-4 h-16 bg-background border-b border-border sticky top-0 z-50">
        <Link
          href={userRole === "ADMIN" ? "/" : "/stock"}
          className="flex items-center gap-3 overflow-hidden"
        >
          <div className="w-9 h-9 flex items-center justify-center rounded-lg overflow-hidden border border-border bg-background shrink-0">
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

        <div className="flex items-center gap-1">
          <CartButton />
          <button
            onClick={() => setIsOpenMobile(!isOpenMobile)}
            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors cursor-pointer shrink-0"
            aria-label="Alternar menú"
          >
            {isOpenMobile ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* OVERLAY OSCURO MÓVIL */}
      {isOpenMobile && (
        <div
          className="md:hidden fixed inset-0 top-16 bg-black/40 z-50 backdrop-blur-sm"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
        fixed md:sticky top-16 md:top-0 left-0 h-[calc(100vh-64px)] md:h-screen 
        bg-background md:bg-transparent border-r border-border md:border-none 
        flex flex-col shrink-0 z-50 transition-all duration-300 ease-in-out
        ${isOpenMobile ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        ${isCollapsed ? "md:w-20" : "w-full md:w-64"} w-64
      `}
      >
        {/* BRANDING DESKTOP */}
        <div
          className={`hidden md:flex items-center border-b border-transparent h-16 shrink-0 transition-all duration-300 ${isCollapsed ? "justify-center px-0" : "px-6 gap-3"}`}
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
          {!isCollapsed && (
            <span className="font-bold text-lg text-foreground tracking-tight truncate whitespace-nowrap">
              {branding.posName}
            </span>
          )}
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpenMobile(false)}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center rounded-lg transition-all font-medium ${
                  isCollapsed
                    ? "justify-center h-10 w-10 mx-auto"
                    : "gap-3 px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? "text-primary-foreground" : ""
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER / LOGOUT */}
        <div className="p-3 border-t border-transparent">
          <form action={logoutAction}>
            <button
              type="submit"
              title={isCollapsed ? "Cerrar Sesión" : undefined}
              className={`flex items-center text-rose-600 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer font-medium ${
                isCollapsed
                  ? "justify-center h-10 w-10 mx-auto"
                  : "w-full gap-3 px-3 py-2.5"
              }`}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Cerrar Sesión</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
