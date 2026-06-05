Los items que tienen # al principio significa que ya estan hechos
Los items que tienen ### al principio significa que estoy trabajando

🚀 FASE 1: Cimientos del SaaS (Lo Urgente)
El objetivo de esta fase es que el sistema deje de ser "El POS del Vivero" y se convierta en un software que le puedas vender a cualquier rubro hoy mismo.

1 - Límites de Infraestructura: Restringir la subida a un máximo de 3 fotos por producto. (Ahorro brutal de costos de servidor y carga visual más rápida).

2 - Gestión de Empleados: Crear roles básicos (Dueño y Vendedor). El vendedor solo puede cobrar y ver el catálogo; no puede ver las ganancias ni eliminar productos, máximo 2 vendedores más.

3 - Estandarización Dinámica: Mover Categorías y Variantes (talles, colores) a la base de datos para que cada negocio cree las suyas propias.

⭐ FASE 1: La Experiencia de Venta (Lo que Enamora al Dueño)
Aquí construimos las herramientas de uso diario. Esto es lo que el comerciante tocará 50 veces al día.

1 - Ventas sin Fricción: Permitir ventas con stock negativo (mostrando una ⚠️ alerta visual). La realidad física manda; nunca bloquees una venta.

# 2 - Métodos de Pago Base: Implementar un selector al cobrar: Efectivo (por defecto), Tarjeta, Transferencia/App.
# 3 - Pantalla de "Venta Realizada": El modal de éxito final con el botón estrella: "Enviar Comprobante por WhatsApp". Tu motor oculto de marketing.
# 4 - Detalle y Ganancia: La pantalla de resumen de cada venta que le muestre al dueño exactamente cuánta ganancia neta le dejó esa operación específica.
# 5 - Devoluciones Simples: Un botón de "Registrar Devolución" con motivo, preguntando si el stock y el dinero vuelven a sus lugares. Nada de "Notas de Crédito" complejas aún.
# 6 - Descuentos Comerciales: Botón en el carrito para aplicar descuento por % o monto fijo. Ideal para el marketing cruzado que planeaste.

📈 FASE 3: Inteligencia y Retención (El Upsell)
Estas son las funciones "Premium" que justifican cobrar una suscripción mensual más cara.

# 10 - Insights y Gráficos: Evolución de ventas y horarios pico, pero traducidos a lenguaje humano. Tarjetas con 💡 consejos (ej: "Asegura cambio a las 18hs, es tu pico de ventas"). Mantener el ranking de Mayor Rotación.
 11 - Módulo CRM Opcional: Si el negocio lo desea, puede pedir Nombre y WhatsApp al cobrar para ir armando su propia base de datos de clientes.

# 12 - Apertura y Cierre de Caja (Mi sugerencia): Control de turnos. "El empleado Juan abrió la caja con $10.000 y la cerró con $45.000". Fundamental para la paz mental del dueño.

13 - Presupuestos y Órdenes: Estados de venta (Cobrado, Presupuesto, A Confirmar). Clave para oficios o ventas grandes.

---

# mejorar ui carrito de venta
# modificacion de precios masivos
# boton de descargar pwa
# ticket en formato pdf
# dark/light mode
# - mejorar el dashboard inicial y mejorar el modulo de reportes/metricas
# - el modulo de reportes: quiero traer por fechas el Flujo de Ingresos Diarios; Ventas por Categoría no me trae correctamente las funciones; Rentabilidad por Categoría tiene el mismo problema ademas el chart no se ve bien.
# - modulo de reportes: margen operativo estimado en porcentaje, falta ver el monto en $ asociado.
# - Ingresos Brutos vs Ganancia Bruta: micro-copy. Total vendido antes de costos y gastos. y Ingresos menos costo de mercadería.
# - Reportes / Ventas: Agregaría ventas por día/hora.
# - Ventas por categoría debería tener selector de métrica: [Ingresos] [Unidades] [Tickets]
- Falta rentabilidad por producto en tabla más detallada: una tabla filtrable sería muy buena:
  Producto | Ingresos | Costo | Ganancia | Margen

# - Reportes / Inventario: Agregaría “valor potencial de venta”
#  Además de capital inmovilizado al costo, sería útil mostrar:
# Valor al costo: $X
# Valor potencial de venta: $Y
# Ganancia potencial: $Z 

# - Productos sin movimiento: definir ventana:
#  hace 30 días - hace 60 días - hace 90 días

- en el modulo de stock debo poder ordenar en la tabla por nombre, por mas/menos stock y filtro stock-bajo.

# - Relación bajas / ingresos
# Muy buen KPI: Bajas sobre ingresos: 2.4%. Porque $20.000 en bajas puede ser mucho o poco según cuánto vendiste.


- los datos del negocio ubicados en el catalogo: direccion, nombre, logo, redes sociales, whatsapp
  -- categorias tambien

- completar el panel de configuraciones
- conectar promociones con modulo de reportes
- modularizar el componente de vistas (tienen el filterToolBar integrado)
- Lectura de código de barras
- el modulo de caja no deberia entrar en el primer nivel de emprendedor, si en el segundo
- Método de pago mixto
- Métodos de pago configurables (comisión estimada, plazo de acreditación): Mercado Pago: 6% comisión; Crédito: 8% comisión; Transferencia: 0%
- Comisiones por método de pago (bruto cobrado, comisión estimada, neto estimado). Ejemplo: Tarjeta: $100.000 - Comisión: $6.000 = Neto: $94.000
- Devoluciones y anulaciones. Distinguir: anular venta completa; devolución parcial; cambio de producto; devolución con reintegro; devolución a cuenta corriente
- Exportar datos:ventas; inventario; clientes; caja; reportes
- Promociones mejoradas: agregar fecha de inicio y fecha de caducacion.

- tema impositivo en ticket. Facturación / integración fiscal
