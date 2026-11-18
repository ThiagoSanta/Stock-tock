# Stock-tock Enterprise (V1)

Plataforma integral y configurable de gestión comercial, inventario multidepósito y trazabilidad para PyMEs, cadenas comerciales y distribuidoras.

Diseñada bajo **Arquitectura Hexagonal (Puertos y Adaptadores)** y principios de Domain-Driven Design (DDD), con persistencia nativa en **Supabase (PostgreSQL Cloud)** y una interfaz web en modo oscuro de alto rendimiento construida con **Next.js 16 (Turbopack)** y **Tailwind CSS**.

---

## 🔒 Las 5 Reglas de Negocio Inviolables (V1)

1. **`BLOCK` - Cero Stock Negativo Inviolable:**
   Ninguna operación (venta de mostrador, despacho de pedido o ajuste manual) puede dejar el stock físico o disponible en valores menores a 0. Protegido por `CHECK (physical_stock >= 0 AND available_stock >= 0)` a nivel de motor PostgreSQL y validado en los casos de uso.
2. **`MANUAL` - Liberación Humana de Reservas:**
   Los pedidos confirmados retienen stock disponible. Las reservas no caducan automáticamente para evitar cancelaciones involuntarias; el sistema alerta y requiere decisión del operador (despachar o cancelar).
3. **`SINGLE` - Moneda Única en V1 (ARS):**
   Toda la valuación de inventario, comprobantes, compras y costos opera en pesos argentinos (`ARS`) para evitar distorsiones cambiarias.
4. **`COMPANY` - Costo Promedio Ponderado Global (PPP):**
   El costo de reposición se calcula a nivel empresa (no por depósito) ante cada recepción de compra mediante la fórmula:
   $$C_{ppp} = \frac{(Q_{anterior} \times C_{anterior}) + (Q_{ingreso} \times C_{compra})}{Q_{anterior} + Q_{ingreso}}$$
5. **`DISPATCH` - Deducción Física Estricta al Despacho:**
   El stock físico solo disminuye cuando la mercadería sale efectivamente del depósito (al despachar un pedido o al cobrar en mostrador express), momento en el cual se emite el comprobante y el movimiento de Kardex.

---

## 🧭 Mapa de Módulos Implementados

| Módulo | Ruta | Capacidades Principales |
|---|---|---|
| **Dashboard** | `/` | Indicadores KPI en tiempo real (ventas, stock físico, reservado, disponible, valuación), feed de últimos movimientos y acceso a venta rápida POS. |
| **Catálogo** | `/productos` | Alta y edición de productos, SKU, código de barras, precios (costo PPP, venta minorista y mayorista), umbral de alerta y carga de stock inicial con auditoría. |
| **Inventario & Kardex** | `/inventario` | Balance físico segregado por depósito, trazabilidad inmutable en Kardex (10 tipos de movimientos) y simulación de ajustes manuales con motivo obligatorio. |
| **Pedidos** | `/pedidos` | Circuito con reserva de stock disponible, preparación de pedidos, despacho efectivo (con descuento físico atómico) y cancelación manual. |
| **Ventas & Comprobantes** | `/ventas` | Historial unificado de ventas (mostrador POS y despachos), desglose por medio de cobro, margen bruto estimado y ticket comprobante para impresión. |
| **Compras & PPP** | `/compras` | Emisión de órdenes a proveedores y recepción con recálculo automático del Costo Promedio Ponderado (PPP) a nivel corporativo. |
| **Clientes & Proveedores** | `/contactos` | Directorio de clientes y proveedores, CUIT/DNI, teléfonos, historial de facturación acumulada y activación/desactivación de cuentas. |
| **Alertas & Reportes** | `/alertas` | Detección de quiebres de stock, stock por debajo del mínimo, retención demorada de reservas, exportación CSV y planilla impresa para auditoría física. |
| **Configuración** | `/configuracion` | Perfil de empresa, administración de depósitos (alta y selección del depósito predeterminado) y monitor de reglas inviolables. |

---

## 🏛️ Arquitectura del Proyecto

```
src/
├── app/                              # Next.js App Router (Rutas y Páginas)
│   ├── layout.tsx                    # Shell con Sidebar y fondo Dark Zinc
│   ├── page.tsx                      # Dashboard operativo
│   ├── productos/page.tsx            # Catálogo
│   ├── inventario/page.tsx           # Inventario & Kardex
│   ├── pedidos/page.tsx              # Pedidos y despachos
│   ├── ventas/page.tsx               # Historial de ventas y tickets
│   ├── compras/page.tsx              # Compras y recepción PPP
│   ├── contactos/page.tsx            # Clientes y proveedores
│   ├── alertas/page.tsx              # Alertas y reportes
│   └── configuracion/page.tsx        # Configuración y depósitos
├── core/
│   ├── domain/                       # Entidades y tipos puros de dominio
│   │   ├── catalog/                  # Productos y variantes
│   │   ├── inventory/                # Stock, balances y Kardex
│   │   ├── orders/                   # Pedidos y reservas
│   │   ├── sales/                    # Ventas y cobros
│   │   ├── purchases/                # Compras y proveedores
│   │   ├── contacts/                 # Clientes y métricas comerciales
│   │   ├── alerts/                   # Alertas y exportaciones
│   │   └── settings/                 # Empresa y depósitos
│   ├── application/
│   │   ├── ports/                    # Interfaces de repositorios (Puertos Hexagonales)
│   │   └── use-cases/                # Lógica pura de aplicación y orquestación
│   └── infrastructure/
│       └── repositories/             # Implementaciones Supabase / PostgreSQL (Adaptadores)
└── presentation/
    ├── components/                   # Componentes base (Sidebar, MetricCard, etc.)
    └── modules/                      # Modales, tablas y vistas por módulo
```

---

## 🚀 Puesta en Marcha Local

### Prerrequisitos
- Node.js v20+ o v22+
- Cuenta o proyecto en [Supabase](https://supabase.com) con PostgreSQL

### 1. Variables de Entorno (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
```

### 2. Migración de Base de Datos
El esquema completo se encuentra en `docs/04-modelo-datos-supabase.sql`. Podés aplicarlo directamente desde el SQL Editor de Supabase o ejecutando el script automatizado:
```bash
node scripts/migrate.mjs
```

### 3. Ejecución en Desarrollo (Vite SPA Ultrarrápido)
```bash
npm install
npm run dev
```
El servidor de desarrollo con Vite arranca en menos de 1 segundo. Acceder a [http://localhost:3000](http://localhost:3000).

### 4. Compilación de Producción
```bash
npm run build
```
Genera la SPA estática hiper-optimizada en la carpeta `dist/` en ~2 segundos.
