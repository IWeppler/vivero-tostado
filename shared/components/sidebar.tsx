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
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Inventario", href: "/stock", icon: Package },
  { name: "Ventas", href: "/ventas", icon: ShoppingCart },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* MOBILE TOP NAVBAR (Solo visible en celular) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-lg overflow-hidden shadow-sm border border-gray-100 bg-white shrink-0">
            <Image
              src="/ninja-logo.jpg"
              alt="Logo Ninja Camisetas"
              width={36}
              height={36}
              className="object-cover"
            />
          </div>
          <span className="font-bold text-gray-900 tracking-tight">
            Ninja Camisetas
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 -mr-2 text-gray-600 cursor-pointer hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Alternar menú"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* OVERLAY OSCURO */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 top-[69px] bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
        fixed md:sticky top-[69px] md:top-0 left-0 h-[calc(100vh-69px)] md:h-screen w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}
      >
        {/* BRANDING  */}
        <div className="hidden md:flex p-6 items-center gap-3 border-b border-gray-100">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white shrink-0">
            <Image
              src="/ninja-logo.jpg"
              alt="Logo Ninja Camisetas"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">
            Ninja Camisetas
          </span>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)} // Cierra el menú al navegar
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
