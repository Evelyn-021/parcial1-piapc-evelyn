# Plan de implementación: Upgrade 02 - Patrulla con pausas y mirada direccional

## 1. Estado inicial

### Cómo funciona actualmente la patrulla
- **Puntos de patrulla**: `PATROL_POINTS` en `labLevel.ts` (4 GridPoints cíclicos)
- **Pathfinding**: `calculateRoute` (A*/BFS) → `SearchResult.path` → `guardWaypoints` (centros de celdas)
- **Seguimiento**: `advanceAlongPath(position, waypoints, nextWaypoint, distance)` retorna `{position, nextWaypoint, completed, direction}`
- **Ciclo en `updateGuardMovement(delta)`** (`GameScene.ts:310-332`):
  1. Llama `advanceAlongPath` con velocidad × delta
  2. Actualiza `guard.position` y `nextWaypoint`
  3. Si `movement.direction` existe → `guardFacing = movement.direction`
  4. Si `movement.completed` Y `guardStatus === "patrullar"`:
     - `patrolIndex = (patrolIndex + 1) % PATROL_POINTS.length`
     - `navigateToCell(nextPatrolPoint)` → recalcula ruta inmediatamente

### Dónde se completa un segmento
`GameScene.ts:325-330` - condición `movement.completed && this.guardStatus === "patrullar"`

### Cómo se actualiza guardFacing
`GameScene.ts:321-323` - solo cuando hay movimiento: `if (movement.direction) this.guardFacing = movement.direction`

### Lógica existente que debe conservarse
- Pathfinding, `advanceAlongPath`, FSM, percepción, HUD, cono reactivo (Upgrade 01)
- Transiciones `patrullar` → `investigar`/`perseguir` por sonido/visión
- Reinicio con tecla R (`scene.restart()`)
- Patrulla cíclica 4 puntos

### Cambios preexistentes del Upgrade 01 que deben preservarse
- `CONE_REPOSO` / `CONE_ALERTA` y `drawPerception` reactivo
- `VisionResult.visible` controla paleta del cono

---

## 2. Decisión de implementación

### Opciones para representar la pausa sin bloquear

| Opción | Descripción | Compatibilidad |
|---|---|---|
| **A. Timer en GameScene (campo privado + acumular delta)** | `patrolPauseTimerMs: number`; en `update` si >0 acumula delta y no avanza; al expirar recalcula ruta | ✅ Mínima, sin setTimeout, sin bloquear update, sin FSM nueva, capa Phaser |
| **B. setTimeout externo** | `setTimeout(() => navigateToCell(...), 1500)` | ❌ No determinista en tests, rompe control de tiempo del juego |
| **C. Estado "pausa" en FSM dominio** | Nuevo estado en `guardState.ts` | ❌ Rompe restricción "sin FSM nueva", contamina dominio |
| **D. Bandera + timestamp** | `patrolPauseUntil: number` (timestamp absoluto); comparar con `time` en `update` | ✅ Similar a A, pero usa tiempo absoluto |

### Elegida: **Opción A (timer acumulativo en GameScene)**
- Campo privado `patrolPauseRemainingMs: number` (inicial 0)
- En `updateGuardMovement`: si `>0` → resta `delta`, no llama `advanceAlongPath`, no avanza
- Al llegar a waypoint final en `patrullar`: setea `patrolPauseRemainingMs = PATROL_PAUSE_MS` y orienta `guardFacing` hacia siguiente punto
- Durante pausa: `updatePerception` sigue corriendo normalmente (FSM puede transicionar)
- Si FSM sale de `patrullar` → `patrolPauseRemainingMs = 0` (cancela pausa)

**Por qué**: Mínima, determinista, testeable, compatible con arquitectura actual, no bloquea `update`, cancela limpio al transicionar.

---

## 3. Incrementos de trabajo

### Incremento 1: Introducir pausa de patrulla (timer + no avance)
- **Objetivo**: Guardia se detiene ~1500ms al completar segmento en `patrullar`
- **Archivo**: `src/game/scenes/GameScene.ts`
- **Cambio previsto**:
  1. Constante `PATROL_PAUSE_MS = 1500` (línea ~29)
  2. Campo `private patrolPauseRemainingMs = 0` (línea ~77)
  3. En `updateGuardMovement`:
     - Si `patrolPauseRemainingMs > 0`: `patrolPauseRemainingMs -= delta; return;`
     - Al completar segmento en `patrullar`: `patrolPauseRemainingMs = PATROL_PAUSE_MS` (en lugar de navegar inmediato)
- **Criterios**: CA-01 (pausa), CA-03 (reanudación)
- **Validación**: `npm run dev` → observar pausa en cada punto; `npm run typecheck`
- **Riesgo**: Timer no se resetea al reiniciar → agregar en `create()` o `scene.restart()` maneja
- **Detener si**: TypeScript error, guardia no se mueve nunca, pausa no termina

### Incremento 2: Orientar guardFacing hacia siguiente punto durante pausa
- **Objetivo**: Cono apunta al siguiente punto de patrulla mientras está en pausa
- **Archivo**: `src/game/scenes/GameScene.ts`
- **Cambio previsto**:
  - Al iniciar pausa (en Incremento 1): calcular siguiente punto `nextPatrolPoint = PATROL_POINTS[(patrolIndex + 1) % PATROL_POINTS.length]`
  - `guardFacing = normalizado(cellCenter(nextPatrolPoint) - guard.position)`
  - Durante pausa: NO actualizar `guardFacing` desde `movement.direction` (no hay movimiento)
- **Criterios**: CA-02 (mirada)
- **Validación**: `npm run dev` → verificar cono orientado al siguiente punto durante pausa
- **Riesgo**: Cálculo de vector incorrecto → cono apunta mal
- **Detener si**: Cono no apunta al siguiente punto, error en `normalized`

### Incremento 3: Asegurar investigar/perseguir no bloqueados por pausa
- **Objetivo**: Si FSM transiciona durante pausa, pausa se cancela y conducta existente continúa
- **Archivo**: `src/game/scenes/GameScene.ts`
- **Cambio previsto**:
  - En `updatePerception` (tras `computeGuardState`): si `guardResult.transition` y `guardResult.state !== "patrullar"` → `patrolPauseRemainingMs = 0`
  - En `updateGuardMovement`: al inicio, si `guardStatus !== "patrullar"` → `patrolPauseRemainingMs = 0` (guarda defensa)
- **Criterios**: CA-04, CA-05, CA-06
- **Validación**: `npm run dev` → provocar visión/sonido en pausa → verificar persecución/investigación
- **Riesgo**: Pausa persiste tras transición → FSM bloqueada
- **Detener si**: Guardia queda quieto tras visión/sonido en pausa

### Incremento 4: Validación manual completa
- **Objetivo**: Verificar todos los criterios observables
- **Archivo**: Ninguno (solo ejecución)
- **Validación**:
  - CA-01: Pausa ~1500ms en cada punto
  - CA-02: Cono hacia siguiente punto durante pausa
  - CA-03: Reanuda tras pausa
  - CA-04: Visión en pausa → persecución
  - CA-05: Sonido en pausa → investigación
  - CA-06: Sin pausa en investigar/perseguir
- **Riesgo**: Ninguno (solo observación)

### Incremento 5: Regresión y diff final
- **Objetivo**: Confirmar que nada se rompió
- **Comandos**: `npm run test:run` → 48/48; `npm run validate` → OK
- **Diff**: `git diff src/game/scenes/GameScene.ts` → solo cambios en `updateGuardMovement`, `updatePerception`, 2 campos, 1 constante
- **Riesgo**: Regresión en tests existentes
- **Detener si**: Algún test falla → revertir cambios

---

## 4. Validación prevista

| Paso | Acción | Comando / Pasos manuales | Resultado esperado |
|---|---|---|---|
| **V-01** | Pausa visible | `npm run dev` → observar guardia llegar a punto | Se detiene ~1500ms |
| **V-02** | Orientación cono | `npm run dev` → guardia en pausa → ver cono | Apunta a siguiente punto |
| **V-03** | Reanudación | `npm run dev` → esperar fin pausa | Recalcula ruta y parte |
| **V-04** | Visión en pausa | `npm run dev` → pausa → mover jugador a cono | `estado PERSEGUIR`, persigue |
| **V-05** | Sonido en pausa | `npm run dev` → pausa → Q cerca | `estado INVESTIGAR`, investiga |
| **V-06** | Sin pausa en otros estados | `npm run dev` → Q → llegar a punto | No pausa, continúa |
| **V-07** | Tests regresión | `npm run test:run` | 48/48 pass |
| **V-08** | Validación completa | `npm run validate` | typecheck + test + build OK |
| **V-09** | Diff final | `git diff src/game/scenes/GameScene.ts` | Solo cambios previstos |

---

## 5. Evidencia a registrar en `docs/upgrades/02-patrulla-pausas-mirada/evidencia.md`

Para cada validación (V-01 a V-09):

```
### V-XX: [Nombre]
- **Caso ejecutado**: [descripción concreta]
- **Reproducción**: [pasos exactos con teclas/coordenadas]
- **Resultado esperado**: [comportamiento observable]
- **Resultado real observado**: [completar tras ejecución]
- **Limitaciones**: [ej. medición visual, timing manual]
```

Ejemplo CA-01:
```
### CA-01: Pausa al completar segmento
- **Caso ejecutado**: Guardia llega a punto de patrulla en estado patrullar
- **Reproducción**: 
  1. `npm run dev`
  2. Observar guardia (no mover jugador)
  3. Verificar pausa en cada punto
- **Resultado esperado**: ~1500ms quieto por punto
- **Resultado real observado**: [pendiente]
- **Limitaciones**: Medición visual, no frame-perfect
```

---

## 6. Restricciones reiteradas

- ✅ Solo `GameScene.ts`
- ✅ Sin FSM nueva
- ✅ Sin cambios a `pathFollower.ts`, `search.ts`, `guardState.ts`, `perception.ts`
- ✅ Sin `setTimeout`, sin bloqueo de `update`
- ✅ Sin dependencias nuevas
- ✅ Sin animaciones/tweens
- ✅ `npm run validate` debe pasar

---

**¿Aprobás este plan para proceder con el Incremento 1?**