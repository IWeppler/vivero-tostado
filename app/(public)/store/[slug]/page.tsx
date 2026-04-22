import { getProductoBySlugAction } from "@/features/store/actions/store-actions";
import { ProductDetail } from "@/features/store/components/product-detail";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductoPage({ params }: Readonly<PageProps>) {
  const { slug } = await params;

  const { data: producto, error } = await getProductoBySlugAction(slug);

  if (error || !producto) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* CONTENIDO DEL PRODUCTO */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
        <ProductDetail producto={producto} />
      </main>
    </div>
  );
}
