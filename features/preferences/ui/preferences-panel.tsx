"use client";

import { useState, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import {
  Moon,
  Sun,
  Download,
  MonitorSmartphone,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

// 1. Definimos los tipos para evitar usar "any"
type Theme = "light" | "dark" | "system";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// 2. Aumentamos las interfaces globales de TypeScript
declare global {
  interface Window {
    deferredPwaPrompt?: BeforeInstallPromptEvent;
  }
  interface Navigator {
    standalone?: boolean; // Específico de iOS Safari
  }
}

// 🚀 FIX PWA: Capturamos el evento a nivel de módulo tan pronto como el navegador
// evalúa este script. Así evitamos perderlo si se dispara antes de montar React.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.deferredPwaPrompt = e as BeforeInstallPromptEvent;
  });
}

const isPwaInstalled = () => {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
  );
};

const getDeferredPwaPrompt = () => {
  if (typeof window === "undefined") return null;

  return window.deferredPwaPrompt ?? null;
};

export function PreferencesPanel() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  // Usamos la interfaz que creamos en lugar de <any>
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(getDeferredPwaPrompt);
  const [isInstalled, setIsInstalled] = useState(isPwaInstalled);

  useEffect(() => {
    // 🚀 FIX WARNING: Diferimos el setMounted y la lectura del tema al siguiente ciclo
    // del event loop para evitar renderizados en cascada (cascading renders)
    const timer = setTimeout(() => {
      setMounted(true);

      // 1. Detectar el tema actual
      const storedTheme = localStorage.getItem("theme") as Theme | null;
      if (storedTheme) {
        setTheme(storedTheme);
      } else if (document.documentElement.classList.contains("dark")) {
        setTheme("dark");
      }
      setDeferredPrompt(getDeferredPwaPrompt());
    }, 0);

    // 2. Comprobar si la PWA ya está instalada (Standalone mode)

    // 3. Recuperar el evento PWA si ya fue capturado globalmente
    // 4. Mantener la escucha por si el evento se dispara tarde
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const pwaEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(pwaEvent);
      window.deferredPwaPrompt = pwaEvent;
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);

    const root = document.documentElement;

    if (newTheme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else if (newTheme === "light") {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      // Tema del sistema
      localStorage.removeItem("theme");
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const handleInstallClick = async () => {
    if (isInstalled) return;

    if (!deferredPrompt) {
      toast.info("Instalación manual requerida", {
        description:
          "En tu navegador actual debes ir al menú (tres puntos) y seleccionar 'Instalar aplicación' / 'Añadir a pantalla de inicio'.",
      });
      return;
    }

    // Muestra el prompt nativo de instalación
    await deferredPrompt.prompt();

    // Espera la decisión del usuario
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstalled(true);
      toast.success("¡Aplicación instalada con éxito!");
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">
          Preferencias
        </h2>
        <p className="text-muted-foreground text-sm">
          Personaliza la apariencia de la plataforma y gestiona la aplicación
          instalable.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TEMA VISUAL */}
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4">
              {theme === "dark" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Tema Visual
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Elige entre el modo claro para el día o el modo oscuro para
              ambientes con poca luz.
            </p>
          </div>

          <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50">
            <button
              onClick={() => changeTheme("light")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                theme === "light"
                  ? "bg-background shadow-sm text-foreground ring-1 ring-black/5 dark:ring-white/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="w-4 h-4" /> Claro
            </button>
            <button
              onClick={() => changeTheme("dark")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                theme === "dark"
                  ? "bg-background shadow-sm text-foreground ring-1 ring-black/5 dark:ring-white/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="w-4 h-4" /> Oscuro
            </button>
            <button
              onClick={() => changeTheme("system")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hidden sm:flex ${
                theme === "system"
                  ? "bg-background shadow-sm text-foreground ring-1 ring-black/5 dark:ring-white/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MonitorSmartphone className="w-4 h-4" /> Auto
            </button>
          </div>
        </div>

        {/* INSTALACIÓN PWA */}
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Instalar Aplicación (PWA)
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Instala el sistema POS en tu dispositivo para acceder rápidamente
              desde tu pantalla de inicio, sin distracciones del navegador.
            </p>
          </div>

          <Button
            onClick={handleInstallClick}
            disabled={isInstalled}
            className={`w-full font-bold h-11 rounded-xl shadow-none uppercase tracking-widest text-xs transition-all ${
              isInstalled
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default opacity-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                : deferredPrompt
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {isInstalled ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" /> App ya instalada
              </>
            ) : deferredPrompt ? (
              "Instalar App ahora"
            ) : (
              "Instalación Manual / iOS"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
