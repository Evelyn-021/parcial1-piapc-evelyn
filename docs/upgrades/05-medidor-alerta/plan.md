# Plan de implementación: Upgrade 05 - Medidor de alerta y estados del nivel

## 1. Estado inicial

### HUD actual (`navigationHud`)
- **Creación**: `GameScene.create():181-191`
- **Tipo**: `Phaser.GameObjects.Text`
- **Posición**: `(GRID_WIDTH * TILE_SIZE - 16, 14)` → esquina superior derecha
- **Origen**: `(1, 0)` (top-right)
- **Estilo**: monospace, 13px, fondo semitransparente, padding 8x6
- **Profundidad**: 10

### Actualización del HUD
- **Método**: `updateTelemetry(time, vision, soundHeard):444-460`
- **Llamado desde**: `updatePerception():396` cada frame
- **Contenido actual**: Array de strings que incluye `estado ${GUARD_STATUS_LABELS[this.guardStatus]}`

### Estado del guardia
- **Variable**: `this.guardStatus: GuardStatus` (línea 101)
- **Inicial**: `initialGuardState()` → `"patrullar"`
- **Actualización**: En `updatePerception():375-394` via `computeGuardState()`
- **Valores posibles**: `"patrullar" | "investigar" | "perseguir"`

### Cambios previos a preservar (Upgrades 01-04)
| Upgrade | Qué preserva | Dónde está |
|---------|--------------|------------|
| 01 | Cono reactivo (`CONE_REPOSO`/`CONE_ALERTA`, `drawPerception` reactivo) | `drawPerception():400-442` |
| 02 | Pausa patrulla (`patrolPauseRemainingMs`), `guardFacing` hacia siguiente punto, cancelación pausa en transición | `updateGuardMovement():312-352`, `updatePerception():377-378` |
| 03 | Shake+flash en transición a `perseguir` por visión | `updatePerception():380-382` |
| 04 | Distractor sonoro (pulso radio, fill oído/no oído) | `drawPerception():420-435` |

---

## 2. Decisión de implementación

### Alternativas evaluadas

| Opción | Descripción | Pros | Contras |
|--------|-------------|------|---------|
| **A. Un Graphics con fill rect proporcional** | Un `Graphics` único, `fillRect` ancho proporcional al nivel | Simple, un objeto, un draw call, fácil de actualizar | Requiere limpiar y redibujar cada frame |
| **B. 3 Graphics separados (segmentos)** | 3 rectángulos separados, mostrar/ocultar según nivel | No hay redibujo, solo visible/invisible | 3 objetos, más complejo de posicionar |
| **C. Graphics + 3 rectángulos hijos** | Container con 3 rectángulos, `setVisible` | Limpio, encapsulado | Overhead de Container |
| **D. Texto adicional en HUD** | Agregar "[■■■]" al texto existente | Cero objetos nuevos | Limitado visualmente, no es "barra" |

### Elegida: **Opción A - Un Graphics con fill rect proporcional**

**Por qué**:
- ✅ **Mínima**: Un solo `Graphics` nuevo, creado en `create()`, actualizado en `updateTelemetry()`
- ✅ **Sin timers/tweens/animaciones**: Cálculo directo del ancho cada frame
- ✅ **Un draw call**: Limpia y redibuja en `updateTelemetry` (ya se llama cada frame)
- ✅ **Fácil posicionamiento**: Debajo de `navigationHud` usando sus coordenadas
- ✅ **Cero lógica nueva**: Solo mapea `guardStatus` → ancho/color
- ✅ **Cero objetos extra**: Un solo `Graphics` reutilizable

---

## 3. Diseño del medidor

### Posición y dimensiones
- **Ancla**: Debajo de `navigationHud`
- **X**: `navigationHud.x - ALERT_METER_WIDTH` (alineado al borde derecho del HUD)
- **Y**: `navigationHud.y + navigationHud.height + 4` (4px de margen)
- **Ancho total fijo**: `ALERT_METER_WIDTH = 160` (constante, discreto, no varía con el texto)
- **Alto**: 8px (discreto, no invasivo)
- **Profundidad**: 10 (mismo que `navigationHud`)

### Fondo y fill
- **Fondo**: Rectángulo gris oscuro (`0x1a1f2a`, alpha 0.8) - ancho `ALERT_METER_WIDTH`, alto 8px
- **Fill**: Rectángulo coloreado encima - ancho = `ALERT_METER_WIDTH * nivel`, alto 6px (centrado vertical con 1px margen sup/inf)
- **Borde opcional**: Stroke 1px `0x3a4c58` en el fondo para definición

### Correspondencia estado → nivel visual (CONFIGURACIÓN)

| Estado (`guardStatus`) | Nivel | Porcentaje | Color fill (hex) | Color nombre |
|------------------------|-------|------------|------------------|--------------|
| `"patrullar"` | Bajo | 33% (1/3) | `0x2e7d32` | Verde oscuro |
| `"investigar"` | Medio | 66% (2/3) | `0xf57f17` | Amarillo ámbar |
| `"perseguir"` | Alto | 100% (1/1) | `0xc62828` | Rojo oscuro |

> **Nota**: Estos valores son **configuración en código**, no mediciones observadas.

### Colores de fondo/borde (CONFIGURACIÓN)
- **Fondo**: `0x1a1f2a` alpha 0.8
- **Borde**: `0x3a4c58` alpha 1.0, grosor 1px

### Profundidad
- **Fondo + fill**: profundidad 10 (mismo que `navigationHud`)
- **Texto HUD**: profundidad 10 (existente)

---

## 4. Incrementos de trabajo

### Incremento 1: Crear GameObject del medidor en `create()`
- **Objetivo**: Instanciar `alertMeterGraphics` y dibujar fondo inicial
- **Archivo**: `src/game/scenes/GameScene.ts`
- **Cambio**:
  1. Definir constante `private static readonly ALERT_METER_WIDTH = 160;`
  2. En `create()`, después de crear `navigationHud` (línea 191):
     ```typescript
     this.alertMeterGraphics = this.add.graphics().setDepth(10);
     this.drawAlertMeterBackground();
     ```
  2. Método privado `drawAlertMeterBackground()`:
     - Calcula posición usando `ALERT_METER_WIDTH` y `navigationHud` como ancla
     - X = `navigationHud.x - ALERT_METER_WIDTH`
     - Y = `navigationHud.y + navigationHud.height + 4`
     - Dibuja fondo + borde con ancho fijo `ALERT_METER_WIDTH`
- **Criterio**: CA-01 (barra visible)
- **Validación**: `npm run dev` → verificar rectángulo gris debajo del HUD, alineado al borde derecho
- **Riesgo**: Posición incorrecta si `navigationHud` no tiene dimensiones aún
- **Detener si**: TypeScript error, posición fuera de pantalla, fondo no visible

### Incremento 2: Dibujar fill para PATRULLAR (nivel bajo)
- **Objetivo**: Implementar `updateAlertMeter()` y llamada en `updateTelemetry()`; verificar PATRULLAR
- **Archivo**: `src/game/scenes/GameScene.ts`
- **Cambio**:
  1. Definir constante `private static readonly ALERT_METER_WIDTH = 160;`
  2. Método privado `updateAlertMeter()`:
     ```typescript
     private updateAlertMeter(): void {
       const level = this.getAlertLevel(this.guardStatus);
       const fillWidth = ALERT_METER_WIDTH * level;
       // limpiar fill previo, dibujar nuevo fill con color según estado
     }
     private getAlertLevel(status: GuardStatus): number {
       switch (status) {
         case "patrullar": return 1/3;
         case "investigar": return 2/3;
         case "perseguir": return 1;
       }
     }
     ```
  2. En `updateTelemetry()`, al final: `this.updateAlertMeter();`
  3. Constantes de color/porcentaje como `private static readonly`
- **Criterio**: CA-02 (PATRULLAR = 33% verde)
- **Validación**: `npm run dev` → inicio → barra 33% verde
- **Riesgo**: Cálculo de ancho incorrecto, color equivocado
- **Detener si**: TypeScript error, fill no visible, color incorrecto

### Incremento 3: Representación INVESTIGAR y PERSEGUIR
- **Objetivo**: Verificar que fill cambia a 66% amarillo y 100% rojo
- **Archivo**: `src/game/scenes/GameScene.ts` (mismo `updateAlertMeter()`)
- **Cambio**: Ninguno adicional (lógica ya en `getAlertLevel()`)
- **Criterio**: CA-02 (INVESTIGAR 66% amarillo, PERSEGUIR 100% rojo)
- **Validación**: 
  - `npm run dev` → Q cerca → INVESTIGAR → 66% amarillo
  - `npm run dev` → entrar en cono → PERSEGUIR → 100% rojo
- **Riesgo**: Transición no inmediata, color incorrecto
- **Detener si**: Fill no cambia, color incorrecto, transición con lag

### Incremento 4: Reset al reiniciar (R)
- **Objetivo**: Verificar que medidor resetea a 33% verde al presionar R
- **Archivo**: Ninguno (comportamiento automático por `scene.restart()`)
- **Cambio**: Ninguno (el `create()` se vuelve a ejecutar)
- **Criterio**: CA-05
- **Validación**: `npm run dev` → PERSEGUIR → R → barra 33% verde
- **Riesgo**: Estado residual si `create()` no limpia bien
- **Detener si**: Barra no resetea a 33% verde

### Incremento 5: Preservación HUD textual y Upgrades 01-04
- **Objetivo**: Verificar que HUD textual intacto y upgrades previos funcionan
- **Archivo**: Ninguno (solo validación)
- **Criterio**: CA-06, CA-07
- **Validación**: 
  - `npm run dev` → verificar texto "estado XXX" intacto
  - Verificar cono reactivo (Upgrade 01)
  - Verificar pausa patrulla + mirada (Upgrade 02)
  - Verificar shake+flash en PERSEGUIR (Upgrade 03)
  - Verificar distractor sonoro pulso + fill (Upgrade 04)
- **Riesgo**: Regresión visual en Upgrades 01-04
- **Detener si**: Algún upgrade previo roto

### Incremento 6: Regresión y diff final
- **Objetivo**: Confirmar nada roto
- **Validaciones**:
  - CA-04: Prioridad visión → `npm run dev` → cono + Q → PERSEGUIR + 100% rojo
  - CA-08: `npm run test:run` → 48/48 pass
  - CA-09: `npm run validate` → typecheck + test + build OK
  - `git diff src/game/scenes/GameScene.ts` → solo cambios en `create()`, `updateTelemetry()`, nuevos métodos `drawAlertMeterBackground()`, `updateAlertMeter()`, `getAlertLevel()`, constantes
- **Riesgo**: Regresión en tests o build
- **Detener si**: Test falla, build falla, diff incluye archivos no previstos

---

## 5. Validación prevista

| Paso | Acción | Comando / Pasos | Resultado esperado |
|------|--------|-----------------|-------------------|
| **V-01** | Barra visible | `npm run dev` → observar debajo HUD | Rectángulo gris con fill 33% verde visible |
| **V-02** | PATRULLAR | `npm run dev` → inicio | Fill 33% verde (`0x2e7d32`) |
| **V-03** | INVESTIGAR | `npm run dev` → Q cerca guardia | Fill 66% amarillo (`0xf57f17`) |
| **V-04** | PERSEGUIR | `npm run dev` → entrar en cono | Fill 100% rojo (`0xc62828`) |
| **V-05** | Cambio directo | `npm run dev` → Q → observar barra | Salta 33%→66% sin interpolación |
| **V-05b** | INVESTIGAR→PERSEGUIR | `npm run dev` → investigar → entrar cono | Salta 66%→100% sin interpolación |
| **V-06** | Prioridad visión | `npm run dev` → cono + Q mismo frame | 100% rojo (no 66% amarillo) |
| **V-07** | Reset R | `npm run dev` → PERSEGUIR → R | Vuelve a 33% verde |
| **V-08** | HUD textual | `npm run dev` → verificar texto | "estado PATRULLAR/INVESTIGAR/PERSEGUIR" intacto |
| **V-09** | Upgrades 01-04 | `npm run dev` → verificación visual | Cono, pausa, shake/flash, distractor funcionan |
| **V-10** | Tests regresión | `npm run test:run` | 48/48 pass |
| **V-11** | Validación completa | `npm run validate` | typecheck + test + build OK |
| **V-12** | Diff final | `git diff src/game/scenes/GameScene.ts` | Solo `create`, `updateTelemetry`, nuevos métodos, constantes |

---

## 6. Evidencia a registrar en `docs/upgrades/05-medidor-alerta/evidencia.md`

Para cada validación:

```
### V-XX: [Nombre]
- **Caso ejecutado**: [descripción]
- **Reproducción**: [pasos exactos]
- **Resultado observado**: [lo que se vio en pantalla]
- **Valores configurados en código**: [33/66/100%, colores hex, posición, tamaños]
- **Resultados automáticos**: npm run test:run / validate [output]
- **Limitaciones**: [verificación visual, no medición exacta]
```

Ejemplo CA-02:
```
### CA-02: Correspondencia estado → nivel visual
- **Caso ejecutado**: Guardia en PATRULLAR, INVESTIGAR, PERSEGUIR
- **Reproducción**: 
  1. `npm run dev` → inicio → 33% verde
  2. Q cerca → INVESTIGAR → 66% amarillo
  3. Entrar en cono → PERSEGUIR → 100% rojo
- **Resultado observado**: [completar]
- **Valores configurados en código**: 33% verde (0x2e7d32), 66% amarillo (0xf57f17), 100% rojo (0xc62828)
- **Resultados automáticos**: npm run test:run / validate [output]
```

---

## 6. Restricciones reiteradas

- ✅ Solo `GameScene.ts` (`create`, `updateTelemetry`, 3 métodos privados, constantes)
- ✅ Un `Graphics` reutilizable, creado en `create()`, actualizado en `updateTelemetry()`
- ✅ Sin timers, tweens, animaciones, interpolaciones
- ✅ Lectura directa de `this.guardStatus` en `updateTelemetry()`
- ✅ Sin cambios en dominio (`guardState.ts`, `perception.ts`, etc.)
- ✅ Sin cambios en FSM, percepción, pathfinding
- ✅ Sin dependencias nuevas
- ✅ `npm run validate` debe pasar

---

**¿Aprobás este plan para proceder con el Incremento 1 (crear GameObject del medidor)?**