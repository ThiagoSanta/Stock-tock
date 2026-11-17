# Stock-tock

Plataforma configurable de gestión comercial e inventario para PyMEs y comercios.

## Características principales (V1)
- **Inventario:** Control de stock físico, reservado y disponible con regla de bloqueo ante stock negativo.
- **Circuitos comerciales:** Pedidos con reserva, ventas directas / mostrador, y compras con recepción parcial/total.
- **Catálogo flexible:** Productos, variantes, códigos de barras y soporte opcional de lotes/vencimientos.
- **Trazabilidad:** Costo promedio ponderado a nivel empresa y registro inmutable de movimientos.

## Arquitectura
- Arquitectura Hexagonal y modular por dominios.
- Base de datos relacional PostgreSQL (Supabase).
- Frontend web moderno en Next.js con Tailwind CSS y componentes accesibles.
