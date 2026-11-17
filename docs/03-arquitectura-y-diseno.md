# Arquitectura y Estándares de Diseño
**Proyecto:** Stock-tock  
**Versión:** 1.0  

---

## 1. Principios de Arquitectura: Hexagonal y Modular por Dominios

El sistema sigue los principios de la **Arquitectura Hexagonal (Puertos y Adaptadores)** combinada con separación modular por dominio. El objetivo es aislar la lógica comercial de las dependencias externas (base de datos, frameworks y librerías visuales).

```
┌─────────────────────────────────────────────────────────────────┐
│                     CAPA DE PRESENTACIÓN / UI                   │
│   (Next.js App Router, Componentes UI, Formularios, Tablas)     │
└───────────────────────────────┬─────────────────────────────────┘
                                │ invoca
┌───────────────────────────────▼─────────────────────────────────┐
│                  CAPA DE APLICACIÓN (Casos de Uso)              │
│    - CrearPedidoUseCase            - DespacharPedidoUseCase     │
│    - RegistrarVentaDirectaUseCase  - AjustarInventarioUseCase   │
│    - DTOs de entrada y salida      - Orquestación transaccional │
└───────────────┬─────────────────────────────────▲───────────────┘
                │ utiliza                         │ implementa
┌───────────────▼─────────────────────────────────┼───────────────┐
│                    NÚCLEO DE DOMINIO            │               │
│    - Entidades puras (Producto, Stock, Pedido)  │               │
│    - Reglas de negocio (No stock negativo)      │  PUERTOS      │
│    - Cálculo de Costo Promedio Ponderado        │ (Interfaces)  │
│    - Errores de dominio tipados                 │               │
└─────────────────────────────────────────────────┴───────▲───────┘
                                                          │
┌─────────────────────────────────────────────────────────┴───────┐
│                 CAPA DE INFRAESTRUCTURA (Adaptadores)           │
│    - Repositorios PostgreSQL / Supabase                         │
│    - Adaptador de almacenamiento de archivos                    │
│    - Adaptador de autenticación y sesiones                      │
└─────────────────────────────────────────────────────────────────┘
```

### Estructura de Carpetas Propuesta

```text
src/
├── core/                         # Núcleo de la aplicación
│   ├── domain/                   # Entidades, tipos y reglas de negocio puras
│   │   ├── catalog/              # Productos, categorías, variantes
│   │   ├── inventory/            # Stock, depósitos, movimientos
│   │   ├── orders/               # Pedidos y estados
│   │   ├── sales/                # Ventas y cobros
│   │   └── purchases/            # Compras y recepciones
│   │
│   ├── application/              # Casos de uso y puertos (interfaces)
│   │   ├── ports/                # Interfaces de repositorios (IProductRepository, etc.)
│   │   └── use-cases/            # Un archivo por caso de uso (ej. ConfirmOrderUseCase.ts)
│   │
│   └── infrastructure/           # Adaptadores concretos
│       ├── db/                   # Conexión Supabase/PostgreSQL y schemas
│       ├── repositories/         # Implementaciones de las interfaces de puertos
│       └── storage/              # Manejo de imágenes (Supabase Storage)
│
├── presentation/                 # Capa visual (Frontend)
│   ├── components/               # Componentes reutilizables atómicos (Botones, Inputs, Cards)
│   │   ├── ui/                   # Primitivas (diseño accesible tipo Radix/shadcn)
│   │   └── layout/               # Sidebar, Header, Breadcrumbs
│   ├── modules/                  # Vistas compuestas por módulo funcional
│   │   ├── inventory/            # Tablas y modales de inventario
│   │   ├── catalog/              # Formularios de productos y variantes
│   │   ├── pos/                  # Mostrador / Venta rápida
│   │   └── orders/               # Tablero de preparación y despacho
│   └── hooks/                    # Hooks de estado y lógica de interfaz
│
└── app/                          # Next.js App Router (Rutas y Server Actions)
    ├── (auth)/                   # Login, recuperación
    ├── (dashboard)/              # Rutas protegidas de la aplicación
    │   ├── inventario/
    │   ├── productos/
    │   ├── pedidos/
    │   ├── ventas/
    │   └── configuracion/
    └── api/                      # Endpoints REST (si se requieren integraciones externas)
```

---

## 2. Reglas Estrictas de Calidad de Código y Limpieza

Para garantizar que el código sea comprensible, mantenible y modular:

1. **Límite de extensión de archivos:**  
   - Ningún archivo debe superar las **150 - 200 líneas**.
   - Si un archivo crece, se divide en submódulos o subcomponentes especializados.
2. **Responsabilidad Única (SRP):**  
   - Cada función realiza una sola tarea clara.
   - Cada caso de uso resuelve un solo flujo (`CreateOrderUseCase`, `DispatchOrderUseCase`).
3. **Independencia ante eliminación de archivos:**  
   - Los módulos se comunican a través de **interfaces (puertos)**.
   - Si un adaptador de infraestructura o un componente visual se elimina o reemplaza, las reglas de negocio en `domain/` y `application/` no se rompen.
4. **Tipado Estricto (TypeScript):**  
   - Cero uso de `any`.
   - Todos los tipos y DTOs de entrada y salida están declarados y validados.

---

## 3. Sistema de Diseño Visual (Dark Mode Premium)

Inspirado en las referencias visuales aprobadas (estilo Linear, Raycast, Vercel, Lunor):

### Paleta de Colores Primaria

| Token de Color | Valor Hex | Uso Principal |
| :--- | :--- | :--- |
| `--bg-canvas` | `#09090b` | Fondo principal de la aplicación. |
| `--bg-surface` | `#121214` | Fondo de tarjetas, paneles y tablas. |
| `--bg-elevated`| `#18181b` | Modales, popovers y dropdowns. |
| `--border-subtle` | `#27272a` | Bordes finos de separación de 1px. |
| `--accent-primary`| `#84cc16` | **Verde lima brillante:** Botones principales, estados activos, métricas positivas. |
| `--accent-focus` | `#65a30d` | Hover e interacción de acento. |
| `--text-primary` | `#f4f4f5` | Títulos, métricas grandes y texto legible. |
| `--text-muted` | `#a1a1aa` | Etiquetas secundarias, breadcrumbs y fechas. |
| `--badge-danger` | `#ef4444` | Alertas de stock crítico y pedidos cancelados. |
| `--badge-warning`| `#f59e0b` | Pedidos pendientes de confirmación. |

### Componentes de Interfaz
- **Sidebar colapsable:** Navegación por módulos con íconos vectoriales limpios (Lucide Icons).
- **KPI Cards:** Indicadores de volumen, dinero y existencias con comparativas visuales.
- **Buscador Universal (`Ctrl + K`):** Acceso rápido para buscar productos, clientes o pedidos desde cualquier pantalla.
- **Tokens variables:** La paleta se define mediante variables CSS en Tailwind para permitir la futura activación del modo claro sin alterar el código de los componentes.
