const normalizeMetodoPago = (metodo: string) => {
  return metodo.trim().toUpperCase().replaceAll(" ", "_");
};

export const getMetodoPagoColor = (metodo: string) => {
  switch (normalizeMetodoPago(metodo)) {
    case "TRANSFERENCIA":
      return "bg-accent-blue border-accent-blue text-white";

    case "TARJETA":
      return "bg-accent-orange border-accent-orange text-white";

    case "EFECTIVO":
      return "bg-accent-lime border-accent-lime text-neutral-900";

    case "BILLETERA_VIRTUAL":
      return "bg-accent-indigo border-accent-indigo text-white";

    default:
      return "bg-muted text-muted-foreground border-border";
  }
};
