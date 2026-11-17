# Procesos y Máquinas de Estado
**Proyecto:** Stock-tock  
**Versión:** 1.0  

Este documento define el ciclo de vida de los datos, las transiciones de estado permitidas y las operaciones atómicas sobre el inventario.

---

## 1. Ciclo de Vida del Pedido (Order Workflow)

Un pedido permite comprometer mercadería antes de despacharla físicamente.

```mermaid
stateDiagram-v2
    [*] --> BORRADOR: Crear Pedido
    BORRADOR --> CONFIRMADO: Confirmar Disponibilidad (Reserva stock)
    BORRADOR --> CANCELADO: Cancelar
    CONFIRMADO --> EN_PREPARACION: Iniciar Picking/Packing
    CONFIRMADO --> CANCELADO: Cancelar (Libera reserva)
    EN_PREPARACION --> DESPACHADO_PARCIAL: Despacho Parcial (Salida física parcial)
    EN_PREPARACION --> DESPACHADO_TOTAL: Despacho Total (Salida física total + Asienta Venta)
    DESPACHADO_PARCIAL --> DESPACHADO_TOTAL: Despacho Remanente
    DESPACHADO_PARCIAL --> CANCELADO: Cancelar remanente (Libera reserva remanente)
    DESPACHADO_TOTAL --> CERRADO: Finalizar
    CERRADO --> [*]
    CANCELADO --> [*]
```

### Reglas de transición por estado del Pedido:
1. **`BORRADOR`:**
   - Permite editar ítems, cantidades, cliente y precios sin impactar stock.
   - **Impacto en inventario:** Ninguno.
2. **`CONFIRMADO`:**
   - Se valida que `cantidad_solicitada <= stock_disponible`.
   - Si no hay suficiente stock disponible, la confirmación se rechaza (`BLOCK`).
   - **Impacto en inventario:** Incrementa `stock_reservado`; disminuye `stock_disponible`. `stock_fisico` no se altera.
3. **`EN_PREPARACION`:**
   - La mercadería está siendo embalada. La reserva sigue activa.
4. **`DESPACHADO` (Parcial o Total):**
   - La mercadería sale físicamente del depósito.
   - **Impacto en inventario:** Disminuye `stock_fisico` y disminuye `stock_reservado`.
   - **Disparo de Venta:** En este instante se genera el comprobante y registro de venta oficial.
5. **`CANCELADO`:**
   - Si estaba confirmado o en preparación, se libera automáticamente la cantidad reservada (`stock_reservado` baja, `stock_disponible` sube).

---

## 2. Circuito de Ventas

Existen dos canales de ingreso de una venta:

```mermaid
flowchart TD
    Inicio([Inicio de Operación]) --> Tipo{¿Tipo de Venta?}
    
    Tipo -->|Venta Directa / Mostrador| Directa[Seleccionar Cliente o Genérico + Productos]
    Directa --> ValDispo{¿Hay Stock Disponible?}
    ValDispo -->|No| Bloqueo[Operación Bloqueada]
    ValDispo -->|Sí| PagoDirecto[Registrar Pago Declarado]
    PagoDirecto --> AsientoDirecto[Transacción Atómica: Salida Física + Registro Venta]
    AsientoDirecto --> FinDirecta([Comprobante Emitido])
    
    Tipo -->|Venta por Pedido| Pedido[Pedido en Estado EN_PREPARACION]
    Pedido --> Despacho[Confirmar Despacho de Mercadería]
    Despacho --> AsientoPedido[Salida Física + Deducción Reserva + Registro Venta]
    AsientoPedido --> FinPedido([Comprobante Emitido])
```

---

## 3. Circuito de Compras (Órdenes de Compra a Proveedores)

```mermaid
stateDiagram-v2
    [*] --> BORRADOR_COMPRA: Crear Orden de Compra
    BORRADOR_COMPRA --> EMITIDA: Enviar a Proveedor
    BORRADOR_COMPRA --> CANCELADA: Descartar
    EMITIDA --> RECEPCION_PARCIAL: Recibir entrega parcial (Ingreso físico parcial)
    EMITIDA --> RECEPCION_TOTAL: Recibir mercadería completa (Ingreso físico total)
    EMITIDA --> CANCELADA: Cancelar orden
    RECEPCION_PARCIAL --> RECEPCION_TOTAL: Recibir remanente
    RECEPCION_PARCIAL --> CERRADA_CON_DIFERENCIAS: Cerrar sin recibir restante
    RECEPCION_TOTAL --> CERRADA: Finalizar
    CERRADA --> [*]
    CANCELADA --> [*]
```

### Cálculo de Costo Promedio Ponderado (PPP) al recibir compra:
Cuando ingresan $Q_{nueva}$ unidades a un costo unitario $C_{nuevo}$, el nuevo costo promedio de la empresa se actualiza mediante:

$$C_{promedio} = \frac{(Q_{anterior} \times C_{anterior}) + (Q_{nueva} \times C_{nueva})}{Q_{anterior} + Q_{nueva}}$$

---

## 4. Tipos de Movimientos de Inventario (Kardex Inmutable)

Cada movimiento de stock queda registrado de forma inalterable con: `id`, `fecha`, `producto_id`, `variante_id`, `deposito_id`, `tipo_movimiento`, `cantidad`, `stock_fisico_resultante`, `motivo`, `usuario_id` y `referencia_doc` (id de pedido, venta o compra).

| Tipo Movimiento | Efecto Stock Físico | Efecto Stock Reservado | Efecto Stock Disponible | Origen Común |
| :--- | :---: | :---: | :---: | :--- |
| `INGRESO_COMPRA` | $+Q$ | $0$ | $+Q$ | Recepción de orden de compra |
| `INGRESO_AJUSTE` | $+Q$ | $0$ | $+Q$ | Recuento físico / sobrante |
| `SALIDA_VENTA` | $-Q$ | $-Q$ o $0$ | $0$ o $-Q$ | Despacho de pedido o venta directa |
| `SALIDA_AJUSTE` | $-Q$ | $0$ | $-Q$ | Rotura, merma, pérdida |
| `RESERVA_PEDIDO` | $0$ | $+Q$ | $-Q$ | Confirmación de pedido |
| `LIBERACION_PEDIDO` | $0$ | $-Q$ | $+Q$ | Cancelación de pedido |
| `TRANSFERENCIA_SALIDA` | $-Q$ | $0$ | $-Q$ | Envío hacia otro depósito |
| `TRANSFERENCIA_ENTRADA`| $+Q$ | $0$ | $+Q$ | Recepción desde otro depósito |
| `DEVOLUCION_CLIENTE` | $+Q$ | $0$ | $+Q$ | Retorno de producto apto |
