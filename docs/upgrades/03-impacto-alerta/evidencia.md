# Evidencia: Upgrade 03 - Impacto visual extremo de alerta

## Resumen de la intervención
- **Archivo modificado**: `src/game/scenes/GameScene.ts` (únicamente)
- **Cambio**: Camera shake + flash rojo al transicionar a PERSEGUIR por visión
- **Alcance**: Feedback visual extremo de detección; sin cambios en dominio, FSM, percepción, navegación

---

## Matriz criterio → comprobación → resultado real

| ID | Criterio (spec) | Comprobación ejecutada | Resultado real observado |
|---|---|---|---|
| **CA-01** | Shake al transicionar a PERSEGUIR por visión | Prueba manual: `npm run dev` → guardia en patrullar → mover jugador a cono | Camera shake se dispara al cambiar HUD a `estado PERSEGUIR`; efecto percibido claramente |
| **CA-02** | Flash rojo sincronizado | Prueba manual: `npm run dev` → transición a PERSEGUIR por visión | Flash rojo se dispara coincidente con inicio del shake; color rojo visible |
| **CA-03** | Un solo disparo por transición; re-disparo en nueva transición tras reinicio | Prueba manual: `npm run dev` → entrar en cono (efecto 1) → permanecer 3s+ → **sin repetir** → presionar R → entrar en cono (efecto 2) | Efecto 1 en primera entrada; **ningún efecto adicional** durante permanencia; Efecto 2 tras reinicio R y nueva entrada |
| **CA-04** | Sin efecto en transición por sonido | Prueba manual: `npm run dev` → Q (sonido) → INVESTIGAR | **Sin shake ni flash**; solo cambio de estado a INVESTIGAR |
| **CA-05** | Cámara vuelve a estado normal | Prueba manual: provocar shake+flash → esperar > 1s | Posición y color de cámara idénticos a antes del efecto; restauración automática |
| **CA-06** | Tests de regresión pasan | `npm run test:run` | 48/48 tests pasan |
| **CA-07** | Validación completa | `npm run validate` | typecheck + test + build = OK |

---

## Detalle de comprobaciones manuales

### CA-01: Shake al transicionar a PERSEGUIR
- **Transición provocada**: patrullar → perseguir (visión)
- **Reproducción**: 
  1. `npm run dev`
  2. Guardia patrullando, jugador fuera de cono
  3. WASD mover jugador dentro del cono
- **Efecto observado**: Camera shake se dispara en el momento exacto de la transición; HUD muestra `estado PERSEGUIR`
- **Duración aproximada**: Efecto breve, percibido como < 1 segundo (no cronometrado frame-perfect)
- **Cámara restaurada**: Sí, vuelve a posición normal tras el shake
- **Resultado real**: Conforme a especificación

### CA-02: Flash rojo sincronizado
- **Transición provocada**: patrullar → perseguir (visión) / investigar → perseguir (visión)
- **Reproducción**: 
  1. `npm run dev`
  2. Provocar transición a PERSEGUIR por visión (entrar en cono o Q + entrar en cono simultáneo)
- **Efecto observado**: Flash rojo visible al mismo tiempo que inicia el shake; color rojo intenso
- **Duración aproximada**: Efecto muy breve, percibido como < 200ms (no cronometrado frame-perfect)
- **Cámara restaurada**: Sí, color normal restaurado tras el flash
- **Resultado real**: Conforme a especificación

### CA-03: Un solo disparo; re-disparo tras reinicio
- **Transición provocada**: Secuencia completa (entrada → permanencia → reinicio → nueva entrada)
- **Reproducción**: 
  1. `npm run dev`
  2. Entrar en cono → PERSEGUIR (efecto 1: shake + flash)
  3. Permanecer en cono > 3 segundos (verificar **sin** efecto adicional)
  4. Presionar R (reiniciar escena)
  5. Entrar en cono → PERSEGUIR (efecto 2: shake + flash)
- **Efecto observado**: Efecto 1 en paso 2; **ningún efecto** en paso 3 durante permanencia; Efecto 2 en paso 5 tras reinicio
- **Duración aproximada**: Cada efecto breve (~400ms shake, ~150ms flash; no cronometrados frame-perfect)
- **Cámara restaurada**: Sí, tras cada efecto
- **Resultado real**: Conforme a especificación

### CA-04: Sin efecto en transición por sonido
- **Transición provocada**: patrullar → investigar (sonido)
- **Reproducción**: 
  1. `npm run dev`
  2. Guardia en patrullar
  3. Presionar Q cerca del guardia
- **Efecto observado**: **Sin shake ni flash**; HUD cambia a `estado INVESTIGAR` únicamente
- **Cámara restaurada**: N/A (no hubo efecto)
- **Resultado real**: Conforme a especificación (solo visión dispara efecto)

### CA-05: Cámara vuelve a estado normal
- **Reproducción**: 
  1. `npm run dev`
  2. Provocar transición a PERSEGUIR por visión (shake + flash)
  3. Esperar > 1 segundo sin mover cámara
- **Resultado observado**: Cámara en posición y color idénticos a antes del efecto; restauración automática por APIs nativas de Phaser
- **Resultado real**: Conforme a especificación

---

## Validación automática

### npm run test:run
```
> piapc-guardia-sigilo@0.1.0 test:run
> vitest run

 RUN  v4.1.10 C:/Users/USER/Documents/UNIVERSIDAD/PIAPC/Parcial1

 Test Files  7 passed (7)
      Tests  48 passed (48)
   Start at  01:31:14
   Duration  391ms (transform 449ms, setup 0ms, import 767ms, tests 53ms, environment 1ms)
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
   Start at  01:31:22
   Duration  405ms (transform 422ms, setup 0ms, import 751ms, tests 59ms, environment 1ms)

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
dist/assets/index-DCZCMjmG.js    1,499.78 kB │ gzip: 346.05 kB
✓ built in 5.37s
```

**Resultado**: ✅ PASS — typecheck OK, 48 tests OK, build OK

---

## Diff final de GameScene.ts

```diff
diff --git a/src/game/scenes/GameScene.ts b/src/game/scenes/GameScene.ts
index 9d04792..ccd10ba 100644
--- a/src/game/scenes/GameScene.ts
+++ b/src/game/scenes/GameScene.ts
@@ -377,6 +377,10 @@ export class GameScene extends Phaser.Scene {
       if (guardResult.state !== "patrullar") {
         this.patrolPauseRemainingMs = 0;
       }
+      if (guardResult.state === "perseguir" && guardResult.transition.reason === "vision") {
+        this.cameras.main.shake(400, 0.015);
+        this.cameras.main.flash(150, 255, 0, 0);
+      }
       if (guardResult.state === "perseguir") {
         this.navigateToCell(worldToCell(target, TILE_SIZE));
       } else if (guardResult.state === "investigar") {
```

**Estadísticas**:
- Archivos modificados: 1 (`GameScene.ts`)
- Líneas añadidas: 4 (1 condición + 2 llamadas API + 1 cierre)
- Cambios concentrados en: `updatePerception` (líneas 380-383)

---

## Limitaciones

1. **Duraciones no cronometradas frame-perfect**: Las duraciones observadas (~400ms shake, ~150ms flash) son percepción visual, no medición precisa con herramientas de profiling.

2. **FSM sin retorno desde PERSEGUIR**: La FSM actual no implementa transición de PERSEGUIR de vuelta a PATRULLAR ni estados de captura/búsqueda/regreso. Para verificar re-disparo se usó reinicio de escena (R). Es comportamiento preexistente, fuera de alcance.

3. **Chunk size warning**: Build advierte chunk >500kB (preexistente, no introducido por este cambio).

4. **Sin tests unitarios de efecto visual**: La cobertura depende de tests de regresión existentes + validación manual. No hay test automatizado para camera shake/flash.

5. **Flash/shake dependen de APIs nativas Phaser**: Comportamiento exacto (curva de shake, blending de flash) delegado a Phaser 3.90; no configurado más allá de parámetros básicos.

---

## Decisiones humanas registradas

| Decisión | Justificación | Registrada por |
|---|---|---|
| Usar `guardResult.transition.reason === "vision"` como disparador | FSM ya distingue transición real vs permanencia; cero flags extra | Plan (aprobado) |
| Shake 400ms / 0.015 intensidad | Visible pero no mareante; < 1s según spec | Plan (aprobado) |
| Flash 150ms / rojo (255,0,0) | Coherente con `CONE_ALERTA`; breve para no saturar | Plan (aprobado) |
| APIs nativas `camera.shake()` + `camera.flash()` | Auto-restaurables; sin timers propios; sin deps | Plan (aprobado) |
| Disparo en bloque `if (guardResult.transition)` | Punto único donde FSM decide transición real | Plan (aprobado) |
| Aplicar a CUALQUIER transición a PERSEGUIR por visión | `patrullar`→`perseguir` e `investigar`→`perseguir` ambos son detección visual | Spec (aprobada) |
| Re-disparo verificado via reinicio (R) | FSM no tiene retorno a PATRULLAR; reinicio limpia estado limpio | Spec/Plan (aprobado) |

---

## Recomendación final

### ✅ INTEGRAR

**Justificación**:
- Todos los criterios de aceptación (CA-01 a CA-07) cumplidos y verificados
- Validación completa pasa (`npm run validate` = OK)
- Regresión cero: 48/48 tests preexistentes pasan
- Cambio mínimo: 1 archivo, 4 líneas netas, solo efecto visual en `updatePerception`
- Respeta todas las restricciones: sin dominio, sin FSM nueva, sin pathfinding, sin deps, sin flags/timers
- Feedback visual extremo logrado: shake + flash comunican claramente el momento de detección visual

**Próximos pasos sugeridos** (fuera de este upgrade):
1. Considerar test de integración visual si se expande sistema de efectos
2. Evaluar parámetros de shake/flash con playtesting si se requiere ajuste fino

---

**Evidencia completada.** No se requieren commits adicionales en este momento.