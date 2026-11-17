# Alcance Funcional - Versión 1 (V1)
**Proyecto:** Stock-tock  
**Estado:** Confirmado y cerrado para V1  

---

## 1. Visión y Objetivo
Stock-tock es una **plataforma configurable de gestión comercial e inventario**, orientada principalmente a comercios, emprendimientos, distribuidoras y PyMEs que trabajan con productos físicos.

Su objetivo es centralizar la información y ofrecer una visión clara, trazable y auditable de:
- Productos y catálogo con variantes.
- Inventario multidepósito (físico, reservado y disponible).
- Pedidos y despachos.
- Ventas directas (mostrador/POS) y ventas derivadas de pedidos.
- Compras y recepciones parciales/totales.
- Clientes y proveedores.
- Costos (promedio ponderado) y listas de precios.
- Alertas y estadísticas comerciales/operativas.

La universalidad de la plataforma se resuelve mediante un núcleo común sólido y configuraciones opcionales por rubro, evitando complejidades innecesarias para negocios sencillos.

---

## 2. Módulos Incluidos en la V1

| Módulo | Alcance Funcional |
| :--- | :--- |
| **Productos y Catálogo** | Alta, edición, categorías, variantes (talle, color, etc.), imágenes, códigos de barra/SKU, unidades de medida y conversiones. |
| **Inventario** | Existencias físicas, reservas, disponibilidad neta, movimientos trazables, depósitos múltiples y recuentos físicos/ajustes. |
| **Pedidos** | Ciclo completo: borrador, confirmación con reserva, preparación, despachos (totales o parciales) y cancelaciones. |
| **Ventas** | Ventas directas express (mostrador) o derivadas de pedidos despachados; devoluciones y registro inmutable de transacciones. |
| **Compras** | Órdenes de compra a proveedores, recepciones parciales o totales e identificación de diferencias. |
| **Proveedores** | Fichas de proveedores, contactos, catálogo de productos provistos e historial de órdenes. |
| **Clientes** | Fichas de clientes, historial de consumo, listas de precios asignadas y soporte de cliente genérico/mostrador. |
| **Costos y Precios** | Costo de adquisición, costo promedio ponderado a nivel empresa, listas de precios, descuentos y márgenes brutos estimados. |
| **Estadísticas** | KPIs de ventas, productos de mayor/menor rotación, valorización del inventario y evolución de compras. |
| **Informes y Alertas** | Reportes imprimibles y exportables (PDF, Excel, CSV); alertas de stock mínimo, quiebres, vencimientos y reservas demoradas. |
| **Administración** | Configuración de empresa, depósitos, moneda principal, autenticación segura y auditoría de eventos. |

---

## 3. Reglas de Negocio Confirmadas (Inviolables)

1. **Stock Negativo:** `BLOCK`  
   El sistema **bloquea cualquier operación** que pretenda descontar o reservar stock físico por encima de las existencias disponibles reales.
2. **Liberación de Reservas:** `MANUAL`  
   El sistema alerta periódicamente sobre pedidos o reservas antiguas sin despachar, pero **nunca libera stock automáticamente**. La decisión de cancelar o liberar es humana (administrador).
3. **Moneda del Sistema:** `SINGLE`  
   Cada empresa o negocio opera con una única moneda principal en la V1 para evitar complejidades de tipo de cambio fluctuante.
4. **Cálculo de Costo:** `COMPANY`  
   El cálculo del costo promedio ponderado (PPP) se realiza por producto/variante a **nivel empresa**, garantizando una valuación homogénea sin importar en qué depósito físico resida.
5. **Asentamiento de Venta:** `DISPATCH`  
   En el circuito de pedidos, la venta y la deducción física del inventario se asientan formalmente **al momento del despacho efectivo**, no al momento de crear o confirmar el pedido. Para ventas directas de mostrador, la venta y el despacho ocurren en una única transacción atómica.

---

## 4. Trazabilidad de Inventario

El inventario distingue tres dimensiones por producto/variante y depósito:
$$\text{Stock Disponible} = \text{Stock Físico} - \text{Stock Reservado}$$

- **Stock Físico:** Mercadería que existe fácticamente en el depósito.
- **Stock Reservado:** Mercadería comprometida en pedidos confirmados pendientes de despacho.
- **Stock Disponible:** Mercadería libre para nuevas reservas o ventas directas inmediatas.

### Lotes y Vencimientos
- Configurable por producto mediante el flag `controla_lote_vencimiento: boolean`.
- Si es `false`, los movimientos solo requieren depósito y cantidad.
- Si es `true`, los ingresos exigen número de lote y fecha de expiración, habilitando sugerencias de salida **FEFO** (*First Expired, First Out*).

---

## 5. Exclusiones Definitivas para la V1 (Fuera de Alcance)

Para preservar la agilidad de lanzamiento y la estabilidad del producto, quedan estrictamente excluidas de la V1:
- ❌ Facturación fiscal electrónica oficial (integración con AFIP / ARCA u organismos tributarios).
- ❌ Cuentas corrientes complejas, financiación en cuotas y cálculo de intereses.
- ❌ Conciliación bancaria automática y seguimiento de cheques diferidos.
- ❌ Liquidaciones financieras de pasarelas de tarjetas.
- ❌ Módulo de fabricación, recetas o transformación de materias primas.
- ❌ Gestión de nóminas, recursos humanos y liquidación de sueldos.
- ❌ Compras o decisiones de reabastecimiento automáticas sin aprobación humana.

---

## 6. Criterios de Aceptación y Calidad
1. **Atomicidad:** Cada movimiento de inventario debe estar respaldado por una transacción de base de datos (`ACID`). No pueden existir ventas sin movimiento de stock asociado.
2. **Inmutabilidad histórica:** Modificar el precio o costo actual de un producto jamás debe alterar los registros históricos de ventas o compras pasadas.
3. **Separación de datos:** Modelo multi-inquilino preparado con `company_id` en todas las tablas transaccionales.
