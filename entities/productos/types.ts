export interface ProductoStock {
  id: string;
  variante: string;
  cantidad: number;
  codigo_barras?: string | null;
}

export interface Producto {
  id: string;
  nombre: string;
  tipo: string;
  precio: number;
  precio_costo: number;
  imagen_url: string | null;
  creado_en: string;
  publicado: boolean;
  slug: string | null;
  descripcion?: string | null;
  stock?: ProductoStock[];
}
