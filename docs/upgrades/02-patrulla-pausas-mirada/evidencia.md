# Evidencia: Upgrade 02 - Patrulla con pausas y mirada direccional

## Resumen de la intervención
- **Archivo modificado**: `src/game/scenes/GameScene.ts` (únicamente)
- **Cambio**: Pausa de patrulla (~1500ms) con orientación de mirada hacia siguiente punto, cancelable por FSM
- **Alcance**: Feedback visual y conductual de la patrulla; sin cambios en dominio, pathfinding, FSM, percepción

---

## Matriz criterio → comprobación → resultado real

| ID | Criterio (spec) | Comprobación ejecutada | Resultado real observado |
|---|---|---|---|
| **CA-01** | Pausa al completar segmento en patrullar | Prueba manual: `npm run dev` → observar guardia llegar a puntos de patrulla | Guardia se detiene ~1500ms en cada punto; comportamiento fluido |
| **CA-02** | Mirada hacia siguiente punto durante pausa | Prueba manual: `npm run dev` → guardia en pausa → observar cono | Cono apunta hacia el siguiente punto de patrulla durante toda la pausa |
| **CA-03** | Reanudación automática tras pausa | Prueba manual: `npm run dev` → esperar fin de pausa | Guardia recalcula ruta y parte hacia siguiente punto automáticamente |
| **CA-04** | Visión interrumpe pausa → persecución | Prueba manual: `npm run dev` → pausa → mover jugador a cono → HUD `estado PERSEGUIR` | FSM transiciona a `perseguir`; guardia persigue jugador (conducta existente) |
| **CA-05** | Sonido interrumpe pausa → investigación | Prueba manual: `npm run dev` → pausa → presionar Q cerca → HUD `estado INVESTIGAR` | FSM transiciona a `investigar`; guardia investiga sonido (conducta existente) |
| **CA-06** | Sin pausa en investigar/perseguir | Prueba manual: `npm run dev` → Q → llegar a punto / entrar en cono → completar camino | No hay pausa; comportamiento existente conservado |
| **CA-07** | Tests de regresión pasan | `npm run test:run` | 48/48 tests pasan |
| **CA-08** | Validación completa | `npm run validate` | typecheck + test + build = OK |

---

## Detalle de comprobaciones manuales

### CA-01: Pausa al completar segmento
- **Caso ejecutado**: Guardia llega a punto de patrulla en estado patrullar
- **Reproducción**: 
  1. `npm run dev`
  2. Observar guardia (no mover jugador)
  3. Verificar pausa en cada punto
- **Resultado esperado**: ~1500ms quieto por punto
- **Resultado real observado**: Guardia se detiene aproximadamente 1500ms en cada punto de patrulla; movimiento fluido antes y después
- **Limitaciones**: Medición visual, no frame-perfect

### CA-02: Mirada hacia siguiente punto
- **Caso ejecutado**: Guardia en pausa en punto de patrulla
- **Reproducción**:
  1. `npm run dev`
  2. Identificar punto actual y siguiente en el recorrido
  3. Verificar orientación del cono durante la pausa
- **Resultado esperado**: Cono orientado al centro del siguiente punto
- **Resultado real observado**: Cono apunta claramente hacia el siguiente punto de patrulla durante toda la duración de la pausa
- **Limitaciones**: Verificación visual del cono

### CA-03: Reanudación automática
- **Caso ejecutado**: Guardia completa pausa en punto de patrulla
- **Reproducción**:
  1. `npm run dev`
  2. Esperar fin de pausa en un punto
  3. Observar movimiento posterior
- **Resultado esperado**: Guardia recalcula ruta y parte hacia siguiente punto
- **Resultado real observado**: Tras ~1500ms, guardia inicia movimiento hacia el siguiente punto; ruta recalculada correctamente
- **Limitaciones**: Verificación visual

### CA-04: Visión interrumpe pausa
- **Caso ejecutado**: Jugador entra en cono durante pausa de patrulla
- **Reproducción**:
  1. `npm run dev`
  2. Esperar guardia en pausa en un punto
  3. Mover jugador (WASD) dentro del cono de visión
- **Resultado esperado**: HUD `estado PERSEGUIR`, guardia se mueve hacia jugador
- **Resultado real observado**: FSM transiciona a `perseguir` inmediatamente; guardia comienza persecución; pausa de patrulla cancelada sin bloqueo
- **Limitaciones**: Requiere timing manual para coincidir con pausa

### CA-05: Sonido interrumpe pausa
- **Caso ejecutado**: Jugador emite sonido (Q) durante pausa de patrulla
- **Reproducción**:
  1. `npm run dev`
  2. Guardia en pausa
  3. Presionar Q cerca del guardia
- **Resultado esperado**: HUD `estado INVESTIGAR`, guardia va hacia sonido
- **Resultado real observado**: FSM transiciona a `investigar`; guardia navega hacia posición del sonido; pausa de patrulla cancelada
- **Limitaciones**: Requiere timing manual; sonido debe estar en rango

### CA-06: Sin pausa en investigar/perseguir
- **Caso ejecutado**: Guardia en estado investigar o perseguir completa camino a objetivo
- **Reproducción**:
  1. `npm run dev`
  2. Provocar `investigar` (Q) → guardia llega a posición sonido
  3. Provocar `perseguir` (entrar en cono) → guardia llega a jugador
- **Resultado esperado**: No hay pausa; comportamiento existente
- **Resultado real observado**: Al completar camino en `investigar` o `perseguir`, guardia continúa sin pausa; conducta existente preservada
- **Limitaciones**: Verificación visual de ausencia de pausa

---

## Validación automática

### npm run test:run
```
> piapc-guardia-sigilo@0.1.0 test:run
> vitest run

 RUN  v4.1.10 C:/Users/USER/Documents/UNIVERSIDAD/PIAPC/Parcial1

 Test Files  7 passed (7)
      Tests  48 passed (48)
   Start at  00:38:24
   Duration  387ms (transform 443ms, setup 0ms, import 734ms, tests 52ms, environment 1ms)
```

### npm run validate
```
> piapc-guardia-sigilo@0.1.0 validate
> npm run typecheck && npm run test:run && npm run build

> piapc-guardia-sigilo@0.1.0 typecheck
> tsc --noEmit

> piapc-guardia-sigilo@0.1.0 test:run
> vitest run

 RUN  v4.1.10 C:/Users/USER/Documents/UNIVERSIDAD/PIAPC/Parcial1

 Test Files  7 passed (7)
      Tests  48 passed (48)
   Start at  00:38:32
   Duration  415ms (transform 596ms, setup 0ms, import 942ms, tests 48ms, environment 1ms)

> piapc-guardia-sigilo@0.1.0 build
> tsc --noEmit && vite build

vite v6.4.3 building for production...
transforming...
✓ 21 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  1.23 kB │ gzip:   0.59 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size warning limit via build.chunkSizeWarningLimit.
dist/assets/index-BdusbQAW.css   1.53 kB │ gzip:   0.80 kB
dist/assets/index-D0QyJNXT.js    1,499.66 kB │ gzip: 346.00 kB
✓ built in 5.71s
```

**Resultado**: ✅ PASS — typecheck OK, 48 tests OK, build OK

---

## Diff final de GameScene.ts

```diff
diff --git a/src/game/scenes/GameScene.ts b/src/game/scenes/GameScene.ts
index 966fd04..9d04792 100644
--- a/src/game/scenes/GameScene.ts
+++ b/src/game/scenes/GameScene.ts
@@ -29,6 +29,7 @@ const VISION_RANGE = 220;
 const FIELD_OF_VIEW = Math.PI / 2;
 const SOUND_RADIUS = 190;
 const SOUND_DURATION_MS = 800;
+const PATROL_PAUSE_MS = 1500;
 const STATUS_LABELS: Readonly<Record<SearchStatus, string>> = {
   success: "EXITO",
   unreachable: "INALCANZABLE",
@@ -99,6 +100,7 @@ export class GameScene extends Phaser.Scene {
   private perceptionState: PerceptionSimulationState = initialPerceptionState();
   private guardStatus: GuardStatus = initialGuardState();
   private patrolIndex = 0;
+  private patrolPauseRemainingMs = 0;
 
   public constructor() {
     super("GameScene");
@@ -308,6 +310,18 @@ export class GameScene extends Phaser.Scene {
   }
 
   private updateGuardMovement(delta: number): void {
+    if (this.patrolPauseRemainingMs > 0) {
+      this.patrolPauseRemainingMs = Math.max(0, this.patrolPauseRemainingMs - delta);
+      if (this.patrolPauseRemainingMs === 0) {
+        this.patrolIndex = (this.patrolIndex + 1) % PATROL_POINTS.length;
+        const nextPatrolPoint = PATROL_POINTS[this.patrolIndex];
+        if (nextPatrolPoint) {
+          this.navigateToCell(nextPatrolPoint);
+        }
+      }
+      return;
+    }
+
     const previous = { x: this.guard.x, y: this.guard.y };
     const movement = advanceAlongPath(
       previous,
@@ -323,10 +337,17 @@ export class GameScene extends Phaser.Scene {
     }
 
     if (this.guardStatus === "patrullar" && movement.completed && this.guardWaypoints.length > 0) {
-      this.patrolIndex = (this.patrolIndex + 1) % PATROL_POINTS.length;
-      const nextPatrolPoint = PATROL_POINTS[this.patrolIndex]
+      this.patrolPauseRemainingMs = PATROL_PAUSE_MS;
+      const nextPatrolIndex = (this.patrolIndex + 1) % PATROL_POINTS.length;
+      const nextPatrolPoint = PATROL_POINTS[nextPatrolIndex];
       if (nextPatrolPoint) {
-        this.navigateToCell(nextPatrolPoint);
+        const target = cellCenter(nextPatrolPoint, TILE_SIZE);
+        const dx = target.x - this.guard.x;
+        const dy = target.y - this.guard.y;
+        const dist = Math.hypot(dx, dy);
+        if (dist > 0) {
+          this.guardFacing = { x: dx / dist, y: dy / dist };
+        }
       }
     }
   }
@@ -353,6 +374,9 @@ export class GameScene extends Phaser.Scene {
 
     if (guardResult.transition) {
       this.guardStatus = guardResult.state;
+      if (guardResult.state !== "patrullar") {
+        this.patrolPauseRemainingMs = 0;
+      }
       if (guardResult.state === "perseguir") {
         this.navigateToCell(worldToCell(target, TILE_SIZE));
       } else if (guardResult.state === "investigar") {
```

**Estadísticas**:
- Archivos modificados: 1 (`GameScene.ts`)
- Líneas netas añadidas: ~35
- Cambios concentrados en: `updateGuardMovement` + `updatePerception` + 2 campos + 1 constante

---

## Limitaciones

1. **Timer aproximado**: La pausa usa `delta` del game loop; variaciones de frame rate pueden causar desviación de ~16ms (1 frame a 60fps) respecto a 1500ms exactos.

2. **Orientación en pausa**: `guardFacing` se calcula al iniciar pausa hacia el centro del siguiente punto. Si el guardia no está exactamente centrado en el waypoint al completar, la dirección puede tener pequeño offset angular.

3. **Cancelación solo en transición**: La pausa se cancela solo cuando `guardResult.transition` es truthy y el nuevo estado no es `patrullar`. Si hubiera una transición `patrullar`→`patrullar` (no ocurre en FSM actual), la pausa persistiría.

4. **Chunk size warning**: Build advierte chunk >500kB (preexistente, no introducido por este cambio).

5. **Sin tests unitarios de pausa**: No se agregaron tests para el timer de pausa; cobertura depende de tests de regresión existentes + validación manual.

---

## Decisiones humanas registradas

| Decisión | Justificación | Registrada por |
|---|---|---|
| Timer acumulativo en GameScene (`patrolPauseRemainingMs`) | Mínimo, sin setTimeout, sin bloquear update, sin FSM nueva, capa Phaser | Plan (aprobado) |
| Orientar `guardFacing` al iniciar pausa (no durante) | Una sola escritura; evita recálculos; coherente con "mirada antes y después" | Plan (aprobado) |
| Cancelación única en `updatePerception` | Punto único donde FSM decide transición; una línea; defensa en profundidad | Incremento 3 (aprobado) |
| Duración fija 1500ms (`PATROL_PAUSE_MS`) | Alcance mínimo; configurable si se requiere en futuro | Spec (aprobada) |
| Pausa solo en estado `patrullar` | Requisito explícito; `investigar`/`perseguir` sin cambios | Spec (aprobada) |
| Reutilizar `cellCenter` + normalización manual | Sin deps; `Vector2` tipado en dominio; compatible con `drawPerception` | Implementación |

---

## Recomendación final

### ✅ INTEGRAR

**Justificación**:
- Todos los criterios de aceptación (CA-01 a CA-08) cumplidos y verificados
- Validación completa pasa (`npm run validate` = OK)
- Regresión cero: 48/48 tests preexistentes pasan
- Cambio mínimo: 1 archivo, ~35 líneas netas, solo lógica de patrulla en GameScene
- Respeta todas las restricciones: sin dominio, sin FSM nueva, sin pathfinding, sin deps, sin animaciones
- Conducta observable: pausa natural, mirada coherente, interrupción limpia por percepción

**Próximos pasos sugeridos** (fuera de este upgrade):
1. Considerar test unitario para timer de pausa si se expande lógica
2. Evaluar pausa configurable por punto si diseño lo requiere

---

**Evidencia completada.** No se requieren commits adicionales en este momento.