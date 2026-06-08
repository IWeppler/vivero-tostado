"use client";

import Link from "next/link";
import Image from "next/image";
import { CartButton } from "@/shared/ui/cart-button";
import { Search, X, Menu, MapPin, Clock } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, Suspense, useRef } from "react";
import { ConfiguracionPOS } from "@/entities/config/types";
import { Input } from "../ui/input";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";

interface NavbarProps {
  branding: ConfiguracionPOS;
}

function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [term, setTerm] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      setTerm(searchParams.get("q") || "");
    }, 100);
  }, [searchParams]);

  useEffect(() => {
    if (isMobileOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobileOpen]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTerm(val);

    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set("q", val);
    } else {
      params.delete("q");
    }

    if (pathname.includes("/store")) {
      router.replace(`/store?${params.toString()}`);
    } else {
      router.push(`/store?${params.toString()}`);
    }
  };

  return (
    <>
      {/* Desktop Searchbar */}
      <div className="hidden md:flex relative w-65 lg:w-75">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          value={term}
          onChange={handleSearch}
          placeholder="Buscar producto..."
          className="w-full h-10 pl-10 pr-4 bg-[#f5f4f4] border-none outline-none focus:ring-1 focus:ring-foreground text-xs transition-all rounded-none tracking-wide font-medium placeholder:text-muted-foreground/60 text-foreground"
        />
      </div>

      {/* Mobile Icon Button */}
      <button
        className="md:hidden p-2 text-foreground hover:bg-muted transition-colors cursor-pointer"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Search className="w-5 h-5" />
        )}
      </button>

      {/* Mobile Expandable Search Input */}
      {isMobileOpen && (
        <div className="absolute top-16 left-0 w-full bg-white border-b border-border p-3 md:hidden flex animate-in slide-in-from-top-2 z-50">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              value={term}
              onChange={handleSearch}
              placeholder="Buscar producto..."
              className="w-full h-12 pl-10 pr-4 bg-[#f5f4f4] border-none outline-none focus:ring-1 focus:ring-foreground text-xs transition-all rounded-none uppercase tracking-widest font-bold placeholder:text-muted-foreground/60 text-foreground"
            />
          </div>
        </div>
      )}
    </>
  );
}

export function Navbar({ branding }: Readonly<NavbarProps>) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* MARQUEE (ANNOUNCEMENT BAR) */}
      {branding.marquee_activo && branding.marquee_texto && (
        <div className="relative flex overflow-x-hidden bg-foreground text-background font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] py-2 whitespace-nowrap z-50">
          <div className="animate-marquee flex items-center shrink-0">
            <span className="mx-4">{branding.marquee_texto}</span>
            {/* Duplicamos el texto para lograr el efecto infinito suave */}
            <span className="mx-4">{branding.marquee_texto}</span>
            <span className="mx-4">{branding.marquee_texto}</span>
          </div>
        </div>
      )}

      {/* HEADER INTELIGENTE */}
      <header className="bg-white border-b border-border sticky top-0 z-40 flex flex-col">
        {/* LÍNEA PRINCIPAL (Logo, Buscador, Carrito) */}
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between bg-white z-20">
          {/* LADO IZQUIERDO: Menú Hamburguesa (Mobile) */}
          <div className="flex items-center md:hidden w-1/3">
            <button
              className="p-2 -ml-2 text-foreground hover:bg-muted rounded-md cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* CENTRO: Logo y Nombre (Centrado en Mobile, Izquierda en Desktop) */}
          <div className="flex items-center justify-center md:justify-start w-1/3 md:w-auto">
            <Link href="/store" className="flex items-center gap-2 shrink-0">
              {branding.posLogo && (
                <div className="w-10 h-10 flex items-center justify-center rounded-lg overflow-hidden text-white shrink-0">
                  <Image
                    src={branding.posLogo}
                    alt={`Logo ${branding.posName}`}
                    width={52}
                    height={52}
                    className="object-cover"
                  />
                </div>
              )}
              <span className="hidden md:flex font-bold text-lg md:text-xl tracking-tight">
                {branding.posName}
              </span>
            </Link>
          </div>

          {/* LADO DERECHO: Buscador y Carrito */}
          <div className="flex items-center justify-end gap-1 sm:gap-4 w-1/3 md:w-auto md:ml-auto">
            <Suspense
              fallback={<div className="w-10 h-10 md:w-65 bg-transparent" />}
            >
              <SearchBar />
            </Suspense>
            {/* Ocultar carrito si pedidos_whatsapp es falso */}
            {branding.pedidos_whatsapp !== false && <CartButton />}
          </div>
        </div>

        {/*  SUB-BARRA DE INFORMACIÓN (Solo Desktop) */}
        <div className="hidden md:flex w-full bg-[#fcfcfc] border-t border-border text-[10px] font-semibold tracking-wider py-1.5 px-4 sm:px-6 lg:px-8 justify-between items-center text-muted-foreground">
          <div className="flex items-center gap-6">
            {branding.direccion_visible && branding.direccion && (
              <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
                <MapPin className="w-3.5 h-3.5" />
                <span className="uppercase">{branding.direccion}</span>
              </div>
            )}
            <div className="h-4 border border-border"></div>
            {branding.horario_visible && branding.horario_texto && (
              <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
                <Clock className="w-3.5 h-3.5" />
                <span className="uppercase">{branding.horario_texto}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-5">
            {branding.whatsapp && (
              <a
                href={`https://wa.me/${branding.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-[#25D366] transition-colors uppercase"
              >
                <FaWhatsapp className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            {branding.instagram && (
              <a
                href={branding.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-pink-600 transition-colors uppercase"
              >
                <FaInstagram className="w-3.5 h-3.5" /> Instagram
              </a>
            )}
            {branding.facebook && (
              <a
                href={branding.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-blue-600 transition-colors uppercase"
              >
                <FaFacebook className="w-3.5 h-3.5" /> Facebook
              </a>
            )}
          </div>
        </div>

        {/* MENÚ HAMBURGUESA DESPLEGABLE (Mobile) */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-border animate-in slide-in-from-top-2 z-40">
            <div className="p-5 flex flex-col gap-4">
              {branding.direccion_visible && branding.direccion && (
                <div className="flex items-start gap-3 text-sm text-muted-foreground font-medium">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{branding.direccion}</p>
                </div>
              )}

              {branding.horario_visible && branding.horario_texto && (
                <div className="flex items-start gap-3 text-sm text-muted-foreground font-medium">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{branding.horario_texto}</p>
                </div>
              )}

              <div className="border-t border-border my-2" />

              <div className="flex items-center justify-center gap-6">
                {branding.whatsapp && (
                  <a
                    href={`https://wa.me/${branding.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-[#25D366]/10 text-[#25D366] rounded-full"
                  >
                    <FaWhatsapp className="w-5 h-5" />
                  </a>
                )}
                {branding.instagram && (
                  <a
                    href={branding.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-pink-500/10 text-pink-600 rounded-full"
                  >
                    <FaInstagram className="w-5 h-5" />
                  </a>
                )}
                {branding.facebook && (
                  <a
                    href={branding.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-blue-600/10 text-blue-600 rounded-full"
                  >
                    <FaFacebook className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
