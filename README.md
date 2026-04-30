### Fase 1: Optimización Extrema de Imágenes (Quick Win) # 
# Instalar la librería de compresión: Usaremos browser-image-compression (es el estándar de la industria para esto).

# Crear utilidad de cliente: Armar una función optimizarImagen() que reciba los archivos del input, los redimensione a un máximo de 1080px (suficiente para un E-commerce) y los convierta al vuelo a formato .webp con un 80% de calidad.

# Actualizar Modales: Modificar add-modal.tsx y editar-modal.tsx para que, antes de enviar el FormData a la Server Action, procesen las imágenes por esta función.

# Limpiar Server Actions: Simplificar create-producto.ts y edit-producto.ts sabiendo que ahora siempre recibirán archivos ligeros y estandarizados.

### Fase 2: Infraestructura del Módulo de Compras (Base de Datos)
Tabla ordenes_compra: Crear tabla para almacenar la cabecera del pedido (ID, Proveedor, Fecha del remito, Total presupuestado, Estado: PENDIENTE/APROBADA).

Tabla ordenes_items: Crear tabla de "Staging" para las filas del pedido (ID, Orden_ID, Nombre original del proveedor, Variante original, Cantidad, Costo Unitario, Estado del Match).

Tabla diccionario_alias: Crear la tabla de inteligencia que recordará cómo llama el proveedor a las plantas (Ejemplo: Alias: "CRISANTEMO P.P." -> Producto_ID real).

### Fase 3: Ingesta y Procesamiento de Archivos (Backend)
Botón "Importar Pedido": Crear la UI inicial en la vista de Inventario (o una nueva pestaña "Compras") para subir el archivo.

Lector de CSV/Excel: Instalar un parser (como papaparse o xlsx) para que el frontend lea el archivo que envíe Fabbro y lo convierta en un JSON limpio.

Algoritmo de Matching (Emparejamiento): Desarrollar la función que cruza el JSON entrante contra el diccionario_alias y contra tu tabla de productos actuales para detectar qué es nuevo, qué existe, y qué cambió de precio.

### Fase 4: La Interfaz de Conciliación (El "Merge")
Tabla Interactiva: Crear una vista de grilla con indicadores visuales claros (🟢 Match Perfecto, 🟡 Inflación/Cambio de Precio, 🔴 Planta Desconocida).

Combobox Inteligente: Implementar un selector con búsqueda (basado en cmdk de shadcn) para que tu primo asigne manualmente las plantas rojas sin tener que scrollear 300 opciones.

Inputs Reactivos: Habilitar casillas editables en los productos amarillos para que tu primo pueda ajustar el "Precio de Venta" ahí mismo si detecta que el costo de Fabbro subió.

### Fase 5: El "Commit" (Impacto Final)
Server Action de Aprobación: Crear la función que recibe la tabla ya revisada por tu primo.

Transacción Segura: Programar el código en Supabase para que actualice los precio_costo, sume las cantidades en productos_stock, inserte nuevos alias en el diccionario y cambie el estado de la orden a APROBADA, todo en bloque.