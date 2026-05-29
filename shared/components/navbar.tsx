"use client";

import Link from "next/link";
import Image from "next/image";
import { CartButton } from "@/shared/ui/cart-button";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, Suspense, useRef } from "react";
import { ConfiguracionPOS } from "@/entities/config/types";
import { Input } from "../ui/input";

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
          className="w-full h-10 pl-10 pr-4 bg-[#f5f4f4] border-none outline-none focus:ring-1 focus:ring-foreground text-xs transition-all rounded-none uppercase tracking-widest font-bold placeholder:text-muted-foreground/60 text-foreground"
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
        <div className="absolute top-16 left-0 w-full bg-white border-b border-border p-3 md:hidden flex animate-in slide-in-from-top-2">
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

export function Navbar({ branding }: NavbarProps) {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-40">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/store"
          className="flex items-center gap-3 transition-opacity hover:opacity-80 shrink-0"
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-none overflow-hidden text-white">
            <Image
              src={branding.posLogo}
              alt={`Logo ${branding.posName}`}
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <span className="font-semibold text-xl tracking-tight hidden sm:block uppercase">
            {branding.posName}
          </span>
        </Link>

        {/* Agrupamos buscador y carrito a la derecha */}
        <div className="flex items-center gap-1 sm:gap-4 ml-auto">
          <Suspense
            fallback={<div className="w-10 h-10 md:w-65 bg-transparent" />}
          >
            <SearchBar />
          </Suspense>

          <CartButton />
        </div>
      </div>
    </header>
  );
}
