Los items que tienen # al principio significa que ya estan hechos
Los items que tienen ### al principio significa que estoy trabajando

## ✅ Core implementado

# 1 - Apertura y Cierre de Caja: Control de turnos. "El empleado Juan abrió la caja con $10.000 y la cerró con $45.000". Fundamental para la paz mental del dueño.

# 2 - Ventas sin Fricción: Permitir ventas con stock negativo (mostrando una ⚠️ alerta visual). La realidad física manda; nunca bloquees una venta.

# 3 - Métodos de Pago Base: Implementar un selector al cobrar: Efectivo (por defecto), Tarjeta, Transferencia/App.

# 4 - Pantalla de "Venta Realizada": El modal de éxito final con el botón estrella: "Enviar Comprobante por WhatsApp". Tu motor oculto de marketing.

# 5 - Detalle y Ganancia: La pantalla de resumen de cada venta que le muestre al dueño exactamente cuánta ganancia neta le dejó esa operación específica.

# 6 - Devoluciones Simples: Un botón de "Registrar Devolución" con motivo, preguntando si el stock y el dinero vuelven a sus lugares. Nada de "Notas de Crédito" complejas aún.

# 7 - Descuentos Comerciales: Botón en el carrito para aplicar descuento por % o monto fijo. Ideal para el marketing cruzado que planeaste.

# 8 - Insights y Gráficos: Evolución de ventas y horarios pico, pero traducidos a lenguaje humano. Tarjetas con 💡 consejos (ej: "Asegura cambio a las 18hs, es tu pico de ventas"). Mantener el ranking de Mayor Rotación.

Improves:

# mejorar ui carrito de venta

# modificacion de precios masivos

# boton de descargar pwa

# ticket en formato pdf

# dark/light mode

# mejorar el dashboard inicial y mejorar el modulo de reportes/metricas

# el modulo de reportes: quiero traer por fechas el Flujo de Ingresos Diarios; Ventas por Categoría no me trae correctamente las funciones; Rentabilidad por Categoría tiene el mismo problema ademas el chart no se ve bien.

# modulo de reportes: margen operativo estimado en porcentaje, falta ver el monto en $ asociado.

# Ingresos Brutos vs Ganancia Bruta: micro-copy. Total vendido antes de costos y gastos. y Ingresos menos costo de mercadería.

# Reportes / Ventas: Agregaría ventas por día/hora.

# Ventas por categoría debería tener selector de métrica: [Ingresos] [Unidades] [Tickets]

# Reportes/Inventario: Agregaría “valor potencial de venta”

# Además de capital inmovilizado al costo, sería útil mostrar: Valor al costo: $X; Valor potencial de venta: $Y; Ganancia potencial: $Z

# Productos sin movimiento: definir ventana: hace 30 días - hace 60 días - hace 90 días

# en el modulo de stock debo poder ordenar en la tabla por nombre (a-z), mas/menos stock (ej: -5, 1000), orden mayor/menor costo, orden mayor/menor precio venta, y filtro stock-bajo (solo con stock ej: 0 o -10).

# Relación bajas/ingresos: Muy buen KPI: Bajas sobre ingresos: 2.4%. Porque $20.000 en bajas puede ser mucho o poco según cuánto vendiste.

## 🐛 Bugs / Correcciones necesarias

# Reportes: Ventas por categoría no calcula correctamente.

# Reportes: Rentabilidad por categoría no calcula correctamente.

# Reportes: chart de rentabilidad por categoría no se ve bien.

# Revisar obtención de datos por rango de fechas.

# Revisar consistencia entre ingresos, ganancia, caja y descuentos.

### Features para terminar el MVP:

Considero que las features postergadas son indispensables para los planes de gestion/profesional y empresa, pero no tengo clientes en esa parte, tal vez 1 para gestion profesional.

# Modulo de Configuracion:

✅ 1. configuracion/promociones: Mejorar la configuracion de promociones. Fecha de inicio y fin, activo/inactivo. editar, borrar.
-- 2. configuracion/metodos-de-pago: Métodos de pago configurables. Efectivo: 0%, acreditación inmediata; Transferencia: 0%, inmediata; Mercado Pago: 6%, 1 día;
Crédito: 8%, 10 días.
Campos mínimos:
nombre
comisión %
plazo de acreditación

# Modulo de Ventas:

-- 3. Comisiones por método de pago (bruto cobrado, comisión estimada, neto estimado). Ejemplo: Tarjeta: $100.000 - Comisión: $6.000 = Neto: $94.000
-- 4. Método de pago mixto: una venta puede tener 2 metodos de pago. Acá tengo una observación: es muy útil, pero puede complicar bastante caja y reportes. Ejemplo: Venta $100.000; $40.000 efectivo; $60.000 transferencia. Para hacerlo bien, necesitás una tabla algo asi:
venta_pagos

- venta_id
- metodo_pago_id
- monto
- comision
- neto_estimado

-- Postergado. Lectura de código de barras
-- Postergado. Devoluciones y anulaciones. Distinguir: anular venta completa; devolución parcial; cambio de producto; devolución con reintegro; devolución a cuenta corriente
-- Postergado. tema impositivo en ticket. Facturación / integración fiscal

# Modulo de Store:

-- 5. Datos del negocio ubicados en el catalogo: direccion, nombre, logo, redes sociales, whatsapp y categorias

# UI:

-- 8. Modularizar el componente de tabla de ventas y stock (tienen el filterToolBar integrado)
-- 9. Revisar y corregir UX/UI para mobile. fundamental.

# Fix Bug:

-- 10. Advisor-Banner: aparece todo el tiempo. Deberia aparecer una vez al dia.
-- 11. El light/dark mode no funciona correctamente, falta un zustand o algo que persevere.

# Admin:

-- 6. Estandarización Dinámica: Mover Categorías y Variantes (talles, colores) a la base de datos para que cada negocio cree las suyas propias.
-- 7. El modulo de caja no deberia entrar en el primer nivel de emprendedor, si en el segundo
-- 12. Separacion de modulos: Plan 1 — Emprendedor, Plan 2 — Gestión / Profesional, Plan 3 — Empresa / Multi-sucursal
-- Postergado. Presupuestos y Órdenes: Estados de venta (Cobrado, Presupuesto, A Confirmar). Clave para oficios o ventas grandes.
-- Postergado. Módulo CRM Opcional: Si el negocio lo desea, puede pedir Nombre y WhatsApp al cobrar para ir armando su propia base de datos de clientes. cliente, venta fiada, saldo pendiente, pago posterior, historial de deuda
Flujo mínimo que deberías implementar

1. Crear cliente rápido al cobrar
   En el cart-sheet: Cliente: [Consumidor final ▼]
   Opciones: Consumidor final, Buscar cliente, Crear cliente
   Campos mínimos para crear: Nombre, WhatsApp, Nota opcional

2. Método de pago “Cuenta corriente”
   En el checkout: Método de pago: Efectivo, Transferencia, Tarjeta, Cuenta corriente, Pago mixto
   Si elige cuenta corriente, obligás cliente:Para vender a cuenta corriente, seleccioná un cliente.
   Regla clave: No puede haber deuda sin cliente.

3. Pago parcial.Esto es fundamental.
   Ejemplo:Total venta: $100.000; Paga ahora: $30.000 efectivo; Queda pendiente: $70.000
   El sistema debería guardar: Venta total: $100.000; Cobrado: $30.000; Pendiente: $70.000; Estado: Parcial

4. Cobranza posterior
   En ficha del cliente: Saldo pendiente: $70.000 [Registrar pago]
   Al registrar pago: Monto: $30.000; Método: Transferencia; Nota: Pago parcial
   Nuevo saldo: $40.000 pendiente. Y si paga todo: Estado: Pagada
   Estados: Pagada, Parcial, Pendiente, Anulada

5. Lo más importante: separar vendido, cobrado y pendiente
   Esto te cambia el sistema.
   Hasta ahora probablemente pensás: venta = ingreso

Pero con cuenta corriente ya no. Tenés que distinguir:

Vendido = total de ventas generadas
Cobrado = plata que realmente entró
Pendiente = plata en la calle
Ganancia generada = rentabilidad de la venta
Ganancia cobrada = parte efectivamente cobrada, si querés ser más fino

Ejemplo:
Vendiste: $500.000
Cobraste: $350.000
Pendiente: $150.000

Impacto en Caja: Una venta fiada no puede entrar completa a caja. Ejemplo:
Venta: $100.000
Pago inicial: $20.000 efectivo
Pendiente: $80.000

Caja debería registrar:
Ingreso efectivo: $20.000
No: Ingreso efectivo: $100.000

Y reportes comerciales sí pueden mostrar:
Ventas brutas: $100.000
Pendiente de cobro: $80.000

Esta separación es clave para que el sistema sea confiable.

6. Base de datos mínima

clientes
clientes (
id uuid primary key default gen_random_uuid(),
negocio_id uuid not null,
nombre text not null,
whatsapp text,
notas text,
activo boolean default true,
creado_en timestamptz default now(),
actualizado_en timestamptz default now()
);

7. En ventas
   Agregar:
   cliente_id uuid null references clientes(id),
   estado_pago text not null default 'PAGADA',
   total numeric(12,2) not null,
   monto_cobrado numeric(12,2) not null default 0,
   monto_pendiente numeric(12,2) not null default 0

Estados:
PAGADA
PARCIAL
PENDIENTE
ANULADA
venta_pagos

Esto te sirve tanto para método mixto como para cuenta corriente.
venta_pagos (
id uuid primary key default gen_random_uuid(),
venta_id uuid not null references ventas(id),
negocio_id uuid not null,
cliente_id uuid null references clientes(id),
metodo_pago_id uuid null,
monto_bruto numeric(12,2) not null,
comision_estimada numeric(12,2) default 0,
monto_neto numeric(12,2) not null,
tipo text not null,
creado_en timestamptz default now(),
creado_por uuid
);

Tipos:
PAGO_VENTA
PAGO_CUENTA_CORRIENTE
cuenta_corriente_movimientos

8. Esta es la tabla más importante para auditar deuda.
   cuenta_corriente_movimientos (
   id uuid primary key default gen_random_uuid(),
   negocio_id uuid not null,
   cliente_id uuid not null references clientes(id),
   venta_id uuid null references ventas(id),
   pago_id uuid null references venta_pagos(id),

tipo text not null,
monto numeric(12,2) not null,
descripcion text,
creado_en timestamptz default now(),
creado_por uuid
);

Tipos:
DEBITO -- aumenta deuda
CREDITO -- reduce deuda

Saldo:sum(DEBITO) - sum(CREDITO)

Podés calcularlo al vuelo o guardar saldo cacheado en clientes.saldo_pendiente.
Para V1, yo guardaría ambos:
movimientos para auditoría
saldo_pendiente en clientes para performance
Pero asegurate de actualizarlo siempre de forma controlada.

9. Tabla de clientes
   Columnas:
   Cliente | WhatsApp | Total comprado | Saldo pendiente | Última compra | Acciones (Ver, Registrar pago, WhatsApp)

10. Detalle de cliente
    Cards: Saldo pendiente, Total comprado, Cantidad de compras, Última compra

Tabs:Cuenta corriente, Compras, Datos, Notas

Cuenta corriente:
Fecha | Concepto | Debe | Haber | Saldo

11. En el dashboard inicial. Una card pequeña:
    Dinero pendiente
    $150.000
    5 clientes con deuda
    Y un botón: Ver cuentas corrientes

12. En reportes. Más adelante agregaría una tab o sección: Cobros
    Total vendido; Total cobrado; Total pendiente; Clientes con mayor deuda; Deudas más antiguas; Cobros del período

# Modulo de Reportes:

-- Postergado. Exportar datos:ventas; inventario; clientes; caja; reportes
-- Postergado. conectar promociones con modulo de reportes. total descontado,promoción más usada, ventas con promoción, impacto en margen, descuento promedio






////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
🗺️ Roadmap: Arquitectura de Pagos, Comisiones y Rentabilidad Real
Este documento detalla el plan de acción para implementar el registro preciso de métodos de pago, cálculo de comisiones (costos financieros) y la refactorización de las métricas de negocio para mostrar la ganancia neta real. También sienta las bases estructurales para futuros Pagos Mixtos.

🗄️ Fase 1: Base de Datos y Tipos (Supabase & TypeScript)
Objetivo: Crear la estructura inmutable que guardará la "foto" exacta del pago al momento de la venta.

[✅] SQL: Crear la tabla venta_pagos con foreign keys hacia ventas y metodos_pago.
Columnas: id, venta_id, metodo_pago_id, metodo_nombre, metodo_tipo, monto_bruto, comision_porcentaje, comision_monto, monto_neto, acreditacion_dias.

[✅] TypeScript: Actualizar entities/ventas/types.ts.
Modificar la interfaz Venta para reemplazar/agregar el array venta_pagos: VentaPago[].
Crear la interfaz VentaPago.

🛒 Fase 2: Motor de Ventas (Server Actions)
Objetivo: Que al presionar "Confirmar Venta", el sistema capture la comisión vigente, calcule el neto y guarde la trazabilidad.

[✅] UI: Modificar el CartSidebar para enviar al Server Action no solo el string "EFECTIVO", sino el id del método de pago seleccionado.
[✅] Server Action (registrarVentaAction): * Hacer un fetch a la tabla metodos_pago usando el id recibido para obtener el porcentaje de comisión real y días de acreditación en ese preciso instante.

Calcular: monto_bruto, comision_monto y monto_neto.
Insertar en la cabecera ventas (donde total será el bruto).
Insertar en venta_pagos el desglose financiero de esa venta.


🧾 Fase 3: Detalle de Venta y Tickets

Objetivo: Mostrar claridad financiera al admin y discreción al cliente final.

[✅] Vista Interna Admin (TicketSheet): * Agregar la sección "Resumen de Cobro".
Mostrar desglosado: Método, Total Cobrado (Bruto), Costo Financiero (Comisión) y Neto Estimado.
Mostrar el plazo de acreditación (Ej: "Acreditación: en 1 día").
[✅] Vista Cliente (WhatsApp / PDF Export):
Asegurar que el recibo de cara al cliente se mantenga "limpio" (Solo "Medio de Pago: Mercado Pago" y "Total Pagado: $X").
Ocultar estrictamente las comisiones y netos en el PDF y el mensaje de WhatsApp.

💰 Fase 4: Módulo de Caja y Arqueo
Objetivo: El efectivo esperado debe ser intocable, separando claramente la plata física de la digital.

[✅] Action: Actualizar las queries de caja (getTurnDetails y vista inicial) para traer la relación venta_pagos en lugar de un simple string de método.
[✅] UI Dashboard Caja: * Mantener el KPI de Efectivo Esperado enfocado 100% en tipo: 'EFECTIVO'.

Agregar/Modificar las tarjetas de Resumen:
Total Cobrado Bruto.
Comisiones Retenidas (Negativo).
Neto Digital Estimado.

En la tabla de movimientos del turno, mostrar la comisión al hacer hover o en una columna reducida.

📊 Fase 5: Inteligencia de Negocio (Reportes BI)
Objetivo: Que el dueño vea el impacto real de las tarjetas en sus márgenes.
[✅] El Cerebro (get-dashboard-metrics.ts):
- Sumar la nueva variable totalComisiones.
- Cambiar la fórmula madre: Ingresos Brutos - Costo Mercadería = Ganancia Bruta - Egresos Físicos - totalComisiones = Ganancia Neta (Resultado Operativo).
- Mapear ventas agrupadas por método incluyendo sus tres valores: Bruto, Comisión, Neto.

[✅] Tab Rentabilidad:
- Agregar Tarjeta KPI: "Costos Financieros / Comisiones".
- Modificar el DonutChart de Composición Financiera para que la rebanada roja ahora se divida en dos: "Gastos Físicos" y "Comisiones Digitales".

[✅] Tab Ventas:
- Evolucionar el gráfico de métodos de pago. Cambiar el "Progress Bar" simple por una tabla analítica:
- Columnas: Método | Bruto | Costo Fin. | Neto | Participación (%).