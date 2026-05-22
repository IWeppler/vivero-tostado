"use client";

import { CartButton } from "@/shared/ui/cart-button";

export function DashboardNavbar() {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-40">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <div className="flex items-center gap-3">
            <CartButton />
          </div>
        </div>
      </div>
    </header>
  );
}
