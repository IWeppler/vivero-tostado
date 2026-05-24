import { getConfiguracionAction } from "@/features/config/actions/config-actions";
import { ConfigForm } from "@/features/config/ui/config-form";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const { data: config, error } = await getConfiguracionAction();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configuración del Sistema
        </h1>
        <p className="text-muted-foreground mt-1">
          Administra las variables de entorno de tu Punto de Venta.
        </p>
      </div>

      {error || !config ? (
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive font-medium">
          {error || "No se encontró la configuración en la base de datos."}
        </div>
      ) : (
        <ConfigForm config={config} />
      )}
    </div>
  );
}
