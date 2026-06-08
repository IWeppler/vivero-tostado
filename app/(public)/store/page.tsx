import { getProductosAction } from "@/shared/actions/store-actions";
import { StoreCatalog } from "@/features/store/components/store-catalog";
import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Cargamos productos y configuración en paralelo
  const [productosRes, configRes] = await Promise.all([
    getProductosAction(),
    supabase.from("configuracion_pos").select("*").single(),
  ]);

  const productos = productosRes.data || [];
  const error = productosRes.error;
  const config = configRes.data;

  // Si el catálogo está apagado, mostramos una pantalla de cerrado (Task 9 pre-integrada)
  if (config && config.catalogo_activo === false) {
    return (
      <div className="min-h-screen bg-[#fffefe] flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2">
          Comercio Cerrado Temporalmente
        </h1>
        <p className="text-muted-foreground text-center">
          En este momento no estamos recibiendo pedidos online. Por favor,
          vuelva a intentar más tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffefe] flex flex-col">
      {config?.banner_activo && config.banner_imagen && (
        <div className="relative w-full md:aspect-[4/1] overflow-hidden mb-2 lg:mb-8 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.banner_imagen}
            alt="Banner Promocional"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-6">
            {config.banner_titulo && (
              <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight mb-2">
                {config.banner_titulo}
              </h2>
            )}
            {config.banner_subtitulo && (
              <p className="text-sm md:text-lg text-white/90 font-medium max-w-xl mb-6">
                {config.banner_subtitulo}
              </p>
            )}
            {config.banner_boton_texto && config.banner_link && (
              <a
                href={config.banner_link}
                className="bg-white text-black font-bold uppercase tracking-widest text-[10px] sm:text-xs px-8 py-3 rounded-full hover:scale-105 transition-transform"
              >
                {config.banner_boton_texto}
              </a>
            )}
          </div>
        </div>
      )}


      <main className="flex-1 mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 w-full">
        {error ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-center font-medium mt-8">
            Ocurrió un error al cargar el catálogo. Por favor, intenta
            nuevamente más tarde.
          </div>
        ) : (
          <StoreCatalog productos={productos || []} />
        )}
      </main>
    </div>
  );
}
