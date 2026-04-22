import { getProductosAction } from "@/features/store/actions/store-actions";
import { StoreCatalog } from "@/features/store/components/store-catalog";
import { FaInstagram } from "react-icons/fa";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const { data: productos, error } = await getProductosAction();

  return (
    <div className="min-h-screen bg-[#fffefe] flex flex-col">
      <main className="flex-1 mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-border/40 pb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Catálogo Oficial
            </h1>
            <p className="text-md text-muted-foreground mt-1">
              Encontrá la camiseta de tu equipo. Stock limitado.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://instagram.com/ninja.camisetas"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              title="Síguenos en Instagram"
            >
              <FaInstagram className="w-5 h-5" />
              <span className="sr-only">Instagram</span>
            </a>

            {/* Ejemplo: Descomentar para agregar más redes en el futuro */}
            {/* <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-all hover:scale-105"
              title="Síguenos en Facebook"
            >
              <FaFacebook className="w-5 h-5" />
              <span className="sr-only">Facebook</span>
            </a>
            */}
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-center font-medium">
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
