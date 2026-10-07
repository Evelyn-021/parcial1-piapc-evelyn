# Evidencia: Upgrade 04 - Distractores sonoros interactivos

## Resumen de la intervención
- **Archivo modificado**: `src/game/scenes/GameScene.ts` (únicamente)
- **Cambio**: Pulso visual del distractor (radio oscila) + diferenciación oído/no oído (fill + stroke)
- **Alcance**: Feedback visual del distractor sonoro existente; sin cambios en dominio, FSM, percepción, pathfinding

---

## Matriz criterio → comprobación → resultado real

| ID | Criterio (spec) | Comprobación ejecutada | Resultado real observado |
|---|---|---|---|
| **CA-01** | Pulso visual al emitir sonido | `npm run dev` → Q → observar círculo | Círculo amarillo pulsa visiblemente al emitir Q |
| **CA-02** | Feedback "oído" cuando guardia oye | `npm run dev` → guardia en radio 190 → Q → observar círculo | Círculo muestra fill amarillo suave + stroke más fuerte/grueso |
| **CA-03** | Transición a INVESTIGAR observable | `npm run dev` → guardia patrullando en radio → Q → HUD | `estado INVESTIGAR`; guardia navega hacia posición del sonido |
| **CA-04** | Sin transición si fuera de radio | `npm run dev` → guardia >190px → Q → HUD | `sonido FUERA DE RANGO`; **sin** transición a INVESTIGAR; estado mantiene `patrullar` |
| **CA-05** | Prioridad visión sobre sonido | `npm run dev` → jugador en cono Y radio 190 → Q | `estado PERSEGUIR` con shake+flash (Upgrade 03); **sin** INVESTIGAR |
| **CA-06** | Desaparición automática | `npm run dev` → Q → esperar > 800ms | Círculo desaparece automáticamente |
| **CA-07** | Múltiples Q reinician evento | `npm run dev` → Q → 400ms → Q → observar | Un solo círculo correspondiente al último Q; desaparece automáticamente |
| **CA-08** | Tests de regresión pasan | `npm run test:run` | 48/48 tests pasan |
| **CA-09** | Validación completa | `npm run validate` | typecheck + test + build = OK |

---

## Detalle de comprobaciones manuales

### CA-01: Pulso visual al emitir
- **Sonido emitido**: Q presionado en posición jugador
- **Reproducción**: 
  1. `npm run dev`
  2. Jugador quieto, presionar Q
- **Efecto observado**: Círculo amarillo pulsa visiblemente al emitir Q.
- **Configuración implementada**: Amplitud ±6% y ciclo de 400ms según el código.
- **Prioridad visión > sonido**: N/A
- **npm run test:run**: 48/48 pass
- **npm run validate**: PASS (typecheck + test + build)

### CA-02: Feedback oído/no oído
- **Sonido emitido**: Q con guardia en radio 190
- **Reproducción**: 
  1. `npm run dev`
  2. Posicionar guardia a ~100px del jugador
  3. Presionar Q
- **Efecto observado**: Círculo con fill amarillo suave (alpha 0.25) + stroke 3px alpha 0.9
- **¿Fue oído?**: sí
- **Estado resultante**: INVESTIGAR
- **Feedback visual**: Fill amarillo suave + stroke 3px alpha 0.9
- **Prioridad visión > sonido**: N/A
- **npm run test:run**: 48/48 pass
- **npm run validate**: PASS

### CA-03: Transición a INVESTIGAR
- **Sonido emitido**: Q con guardia en radio 190, fuera de visión
- **Reproducción**: 
  1. `npm run dev`
  2. Guardia patrullando, jugador fuera de cono, a <190px
  3. Presionar Q
- **Efecto observado**: HUD `estado INVESTIGAR`; guardia navega hacia círculo; círculo con fill + stroke fuerte
- **¿Fue oído?**: sí
- **Estado resultante**: INVESTIGAR
- **Feedback visual**: Fill amarillo + stroke grueso; guardia navega al círculo
- **Prioridad visión > sonido**: N/A
- **npm run test:run**: 48/48 pass
- **npm run validate**: PASS

### CA-04: Sin transición fuera de radio
- **Sonido emitido**: Q con guardia >190px
- **Reproducción**: 
  1. `npm run dev`
  2. Posicionar guardia a >190px del jugador
  3. Presionar Q
- **Efecto observado**: HUD `sonido FUERA DE RANGO`; **sin** transición a INVESTIGAR; círculo solo stroke tenue
- **¿Fue oído?**: no
- **Estado resultante**: PATRULLAR (se mantiene)
- **Feedback visual**: Solo stroke tenue (2px alpha 0.6, sin fill)
- **Prioridad visión > sonido**: N/A
- **npm run test:run**: 48/48 pass
- **npm run validate**: PASS

### CA-05: Prioridad visión sobre sonido
- **Sonido emitido**: Q con jugador en cono de visión Y dentro de radio 190px
- **Reproducción**: 
  1. `npm run dev`
  2. Posicionar jugador en cono de visión Y a <190px del guardia
  3. Presionar Q mismo frame
- **Efecto observado**: HUD `estado PERSEGUIR`; shake+flash (Upgrade 03); **sin** INVESTIGAR
- **Configuración de prueba**: Se garantizó que el jugador estuviera simultáneamente dentro del cono de visión (visión válida) y dentro del radio sonoro de 190px (sonido válido) al presionar Q.
- **Estado resultante**: PERSEGUIR
- **Feedback visual**: Shake + flash rojo (Upgrade 03)
- **Prioridad visión > sonido**: SÍ - visión ganó
- **npm run test:run**: 48/48 pass
- **npm run validate**: PASS

### CA-06: Desaparición automática
- **Sonido emitido**: Q
- **Reproducción**: 
  1. `npm run dev`
  2. Presionar Q
  3. Esperar a que expire el evento sin nuevo Q
- **Efecto observado**: El círculo desapareció automáticamente.
- **Implementación**: `updatePerceptionSimulation` limpia el evento al expirar (`durationMs = 800`).
- **Prioridad visión > sonido**: N/A
- **npm run test:run**: 48/48 pass
- **npm run validate**: PASS

### CA-07: Múltiples Q reinician evento
- **Sonido emitido**: Q → antes de expirar, Q nuevamente
- **Reproducción**: 
  1. `npm run dev`
  2. Presionar Q
  3. Antes de que expire el evento, mover jugador y presionar Q nuevamente
- **Efecto observado**: El segundo Q reemplazó visualmente al evento anterior; quedó un único círculo en la última posición y luego desapareció automáticamente.
- **Prioridad visión > sonido**: N/A
- **npm run test:run**: 48/48 pass
- **npm run validate**: PASS

---

## Validación automática

### npm run test:run
```
> piapc-guardia-sigilo@0.1.0 test:run
> vitest run

 RUN  v4.1.10 C:/Users/USER/Documents/UNIVERSIDAD/PIAPC/Parcial1

 Test Files  7 passed (7)
      Tests  48 passed (48)
   Start at  02:35:22
   Duration  384ms (transform 396ms, setup 0ms, import 742ms, tests 52ms, environment 1ms)
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
   Start at  02:35:33
   Duration  375ms (transform 346ms, setup 0ms, import 645ms, tests 50ms, environment 1ms)

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
dist/assets/index-QKidXW5j.js    1,500.05 kB │ gzip: 346.12 kB
✓ built in 5.13s
```

**Resultado**: ✅ PASS — typecheck OK, 48 tests OK, build OK

---

## Diff final de GameScene.ts

```diff
diff --git a/src/game/scenes/GameScene.ts b/src/game/scenes/GameScene.ts
index ccd10ba..5e1c839 100644
--- a/src/game/scenes/GameScene.ts
+++ b/src/game/scenes/GameScene.ts
@@ -393,11 +393,11 @@ export class GameScene extends Phaser.Scene {
       this.guardStatus = guardResult.state;
     }
 
-    this.drawPerception(frame.vision);
+    this.drawPerception(frame.vision, frame.soundHeard, time);
     this.updateTelemetry(time, frame.vision, frame.soundHeard);
   }
 
-  private drawPerception(vision: VisionResult): void {
+  private drawPerception(vision: VisionResult, soundHeard: boolean, time: number): void {
     this.perceptionGraphics.clear();
     const facingAngle = Math.atan2(this.guardFacing.y, this.guardFacing.x);
     const halfFieldOfView = FIELD_OF_VIEW / 2.
@@ -418,12 +418,20 @@ export class GameScene extends Phaser.Scene {
     this.perceptionGraphics.strokePath()
 
     if (this.perceptionState.soundEvent) {
-      this.perceptionGraphics.lineStyle(2, 0xe5b454, 0.8);
-      this.perceptionGraphics.strokeCircle(
-        this.perceptionState.soundEvent.position.x,
-        this.perceptionState.soundEvent.position.y,
-        this.perceptionState.soundEvent.radius,
-      );
+      const elapsed = time - this.perceptionState.soundEvent.emittedAtMs;
+      const pulsePhase = (elapsed % 400) / 400;
+      const pulseScale = 1 + Math.sin(pulsePhase * Math.PI * 2) * 0.06;
+      const displayRadius = this.perceptionState.soundEvent.radius * pulseScale;
+      const x = this.perceptionState.soundEvent.position.x;
+      const y = this.perceptionState.soundEvent.position.y;
+      if (soundHeard) {
+        this.perceptionGraphics.fillStyle(0xe5b454, 0.25);
+        this.perceptionGraphics.fillCircle(x, y, displayRadius);
+        this.perceptionGraphics.lineStyle(3, 0xe5b454, 0.9);
+      } else {
+        this.perceptionGraphics.lineStyle(2, 0xe5b454, 0.6);
+      }
+      this.perceptionGraphics.strokeCircle(x, y, displayRadius);
     }
 
     const lastKnown = this.perceptionState.memory.lastKnownPosition.
```

**Estadísticas**:
- Archivos modificados: 1 (`GameScene.ts`)
- Líneas netas añadidas: ~12
- Cambios concentrados en: `drawPerception` (firma + pulso + oído/no oído) + llamada en `updatePerception`

---

## Limitaciones

1. **Duraciones no cronometradas frame-perfect**: Los parámetros del pulso (ciclo 400ms, amplitud ±6%) y `durationMs = 800` son valores configurados en código. La validación manual confirmó que el pulso es visible y que el círculo desaparece automáticamente, pero no se cronometraron las duraciones con herramientas de medición.

2. **Pulso y fill usan el mismo `displayRadius`**: El pulso afecta tanto al fill como al stroke; no hay control independiente de pulso por estado oído/no oído.

3. **Chunk size warning**: Build advierte chunk >500kB (preexistente, no introducido por este cambio).

4. **Sin tests unitarios de feedback visual**: Cobertura depende de tests de regresión existentes + validación manual.

5. **Parámetros hardcodeados**: Ciclo 400ms, amplitud ±6%, alphas 0.25/0.9/0.6 no son configurables.

---

## Decisiones humanas registradas

| Decisión | Justificación | Registrada por |
|---|---|---|
| Pulso = variación de radio (displayRadius) | Separa pulso del estilo oído/no oído; evita conflicto alpha | Plan (aprobado) |
| Oído = fill + stroke grueso; No oído = solo stroke tenue | Diferenciación clara sin nuevos GameObjects | Plan (aprobado) |
| Cálculo en `drawPerception` usando `time - emittedAtMs` | Sin timers/tweens; usa datos ya disponibles | Plan (aprobado) |
| Renombrar `_soundHeard` → `soundHeard` en Incremento 2 | Parámetro ahora sí se usa | Incremento 2 |
| Reutilizar `displayRadius` para fill y stroke | Pulso visible en ambos estilos | Plan (aprobado) |
| Parámetros: ciclo 400ms, ±6%, fill alpha 0.25, stroke 3px/2px | Visible, no distractivo, coherente con Upgrade 01 | Plan (aprobado) |

---

## Recomendación final

### ✅ INTEGRAR

**Justificación**:
- Todos los criterios de aceptación (CA-01 a CA-09) cumplidos y verificados
- Validación completa pasa (`npm run validate` = OK)
- Regresión cero: 48/48 tests preexistentes pasan
- Cambio mínimo: 1 archivo, ~12 líneas netas, solo feedback visual en `drawPerception`
- Respeta todas las restricciones: sin dominio, sin FSM nueva, sin pathfinding, sin deps, sin timers/tweens, sin GameObjects nuevos
- Feedback visual claro: pulso de radio + diferenciación oído/no oído + desaparición auto + prioridad visión preservada

**Próximos pasos sugeridos** (fuera de este upgrade):
1. Considerar parámetros configurables si se expande sistema de distractores
2. Evaluar test visual automatizado si se expande suite de tests

---

**Evidencia completada.** No se requieren commits adicionales en este momento.