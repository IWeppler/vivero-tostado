export interface ProductoStock {
  id: string;
  variante: string;
  cantidad: number;
}

export interface Producto {
  id: string;
  nombre: string;
  temporada: string;
  tipo: string;
  precio: number;
  precio_costo: number;
  imagen_url: string | null;
  creado_en: string;
  publicado: boolean;
  slug: string | null;
  stock?: ProductoStock[];
}
