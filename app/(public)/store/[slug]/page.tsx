import { getProductoBySlugAction } from "@/shared/actions/store-actions";
import { ProductDetail } from "@/features/store/components/product-detail";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getConfiguracionAction } from "@/features/config/actions/config-actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductoPage({ params }: Readonly<PageProps>) {
  const { slug } = await params;

  const [productoRes, configRes] = await Promise.all([
    getProductoBySlugAction(slug),
    getConfiguracionAction(),
  ]);

  const { data: producto, error } = productoRes;
  const { data: config } = configRes;

  if (error || !producto) {
    notFound();
  }

  const NUMERO_WHATSAPP = config?.whatsapp;

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* CONTENIDO DEL PRODUCTO */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
        <ProductDetail
          producto={producto}
          baseUrl={baseUrl}
          numeroWhatsApp={NUMERO_WHATSAPP}
        />
      </main>
    </div>
  );
}
