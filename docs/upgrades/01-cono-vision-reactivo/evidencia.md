# Evidencia: Upgrade 01 - Cono de vision visible y reactivo

## Resumen de la intervencion
- **Archivo modificado**: `src/game/scenes/GameScene.ts` (unicamente)
- **Cambio**: Dos paletas visuales (`CONE_REPOSO`, `CONE_ALERTA`) + refactor de `drawPerception()` para seleccionar por `vision.visible`
- **Alcance**: Feedback visual del cono existente; sin cambios en dominio, percepcion, FSM, simulacion

---

## Matriz criterio -> comprobacion -> resultado real

| ID | Criterio (spec) | Comprobacion ejecutada | Resultado real observado |
|---|---|---|---|
| **CA-01** | Cono en reposo cuando `visible: false` | Prueba manual: `npm run dev` -> jugador fuera del rango visual -> HUD `vision FUERA DE RANGO` | OK. Cono renderizado con paleta reposo: fill azul (`#6b8afd`), alpha bajo, borde fino |
| **CA-02** | Cono en alerta cuando `visible: true` | Prueba manual: `npm run dev` -> jugador dentro de la vision sin oclusion -> HUD `vision VISIBLE` | OK. Cono renderizado con paleta alerta: fill rojo (`#e16969`), alpha alto, borde grueso |
| **CA-03** | Cono en reposo cuando `reason: "occluded"` | Prueba manual: `npm run dev` -> jugador detras de una pared -> HUD `vision OCLUIDO` | OK. Cono con paleta reposo (no alerta), consistente con `visible: false` |
| **CA-04** | Transicion inmediata sin tween | PENDIENTE de comprobacion manual especifica | No verificado manualmente en esta sesion |
| **CA-05** | Tests de regresion pasan | `npm run test:run` | OK. 48/48 tests pasan (12 percepcion + 10 FSM + 26 navegacion/modelo) |
| **CA-06** | Validacion completa pasa | `npm run validate` | OK. typecheck + test + build = OK (ver salida completa abajo) |

---

## Detalle de comprobaciones manuales

### V-01: Estado reposo (visible: false)
- **Caso ejecutado**: Jugador fuera del campo visual del guardia
- **Reproduccion**: `npm run dev` -> mover jugador fuera del rango visual del guardia
- **Resultado esperado**: Cono con paleta reposo (azul, alpha bajo, borde fino)
- **Resultado real observado**: Cono azul tenue con borde visible, coincidente con paleta CONE_REPOSO; HUD mostro `vision FUERA DE RANGO`
- **Caso limite verificado**: N/A
- **Salida npm run validate**: (ver seccion "Validacion completa" abajo)

### V-02: Estado alerta (visible: true)
- **Caso ejecutado**: Jugador dentro del campo visual sin oclusion
- **Reproduccion**: `npm run dev` -> mover jugador dentro del cono del guardia sin paredes de por medio
- **Resultado esperado**: Cono con paleta alerta (rojo, alpha alto, borde grueso)
- **Resultado real observado**: Cono rojo intenso con borde grueso, coincidente con paleta CONE_ALERTA; HUD mostro `vision VISIBLE`
- **Caso limite verificado**: N/A
- **Salida npm run validate**: (ver seccion "Validacion completa" abajo)

### V-03: Oclusion mantiene reposo
- **Caso ejecutado**: Jugador geometricamente en direccion del cono pero pared intermedia
- **Reproduccion**: `npm run dev` -> posicionar jugador detras de una pared respecto al guardia
- **Resultado esperado**: Cono con paleta reposo (no alerta)
- **Resultado real observado**: Cono azul (reposo) pese a geometria favorable; HUD confirma `vision OCLUIDO`
- **Caso limite verificado**: `reason === "occluded"` con geometria dentro de rango y direccion del cono
- **Salida npm run validate**: (ver seccion "Validacion completa" abajo)

### V-04: Transicion inmediata
- **Caso ejecutado**: PENDIENTE de comprobacion manual especifica
- **Reproduccion**: No realizada en esta sesion
- **Resultado esperado**: Cambio instantaneo sin tween
- **Resultado real observado**: No verificado
- **Caso limite verificado**: N/A
- **Salida npm run validate**: (ver seccion "Validacion completa" abajo)

---

## Validacion completa (npm run validate)

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
   Start at  00:03:09
   Duration  380ms (transform 375ms, setup 0ms, import 683ms, tests 53ms, environment 1ms)

> piapc-guardia-sigilo@0.1.0 build
> tsc --noEmit && vite build

vite v6.4.3 building for production...
transforming...
OK 21 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  1.23 kB | gzip:   0.59 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size warning limit via build.chunkSizeWarningLimit.
dist/assets/index-BdusbQAW.css   1.53 kB | gzip:   0.80 kB
dist/assets/index-CIp5IX2n.js    1,499.21 kB | gzip: 345.88 kB
OK built in 5.18s
```

**Resultado**: OK. PASS - typecheck OK, 48 tests OK, build OK

---

## Diff final de GameScene.ts

```diff
diff --git a/src/game/scenes/GameScene.ts b/src/game/scenes/GameScene.ts
index 8b25d17..966fd04 100644
--- a/src/game/scenes/GameScene.ts
+++ b/src/game/scenes/GameScene.ts
@@ -49,6 +49,30 @@ const GUARD_STATUS_LABELS: Readonly<Record<GuardStatus, string>> = {
   perseguir: "PERSEGUIR",
 };
 
+interface ConeStyle {
+  readonly fillColor: number;
+  readonly fillAlpha: number;
+  readonly lineColor: number;
+  readonly lineAlpha: number;
+  readonly lineWidth: number;
+}
+
+const CONE_REPOSO: ConeStyle = {
+  fillColor: 0x6b8afd,
+  fillAlpha: 0.12,
+  lineColor: 0x6b8afd,
+  lineAlpha: 0.6,
+  lineWidth: 2,
+};
+
+const CONE_ALERTA: ConeStyle = {
+  fillColor: 0xe16969,
+  fillAlpha: 0.25,
+  lineColor: 0xe16969,
+  lineAlpha: 0.9,
+  lineWidth: 3,
+};
+
 export class GameScene extends Phaser.Scene {
   private player!: Phaser.GameObjects.Rectangle;
   private playerBody!: Phaser.Physics.Arcade.Body;
@@ -349,7 +373,9 @@ export class GameScene extends Phaser.Scene {
     this.perceptionGraphics.clear();
     const facingAngle = Math.atan2(this.guardFacing.y, this.guardFacing.x);
     const halfFieldOfView = FIELD_OF_VIEW / 2;
-    this.perceptionGraphics.fillStyle(vision.visible ? 0x73c991 : 0x6b8afd, 0.16);
+    const style = vision.visible ? CONE_ALERTA : CONE_REPOSO;
+    this.perceptionGraphics.fillStyle(style.fillColor, style.fillAlpha);
+    this.perceptionGraphics.lineStyle(style.lineWidth, style.lineColor, style.lineAlpha);
     this.perceptionGraphics.beginPath();
     this.perceptionGraphics.moveTo(this.guard.x, this.guard.y);
     this.perceptionGraphics.arc(
@@ -361,6 +387,7 @@ export class GameScene extends Phaser.Scene {
     );
     this.perceptionGraphics.closePath();
     this.perceptionGraphics.fillPath()
+    this.perceptionGraphics.strokePath();
 
     if (this.perceptionState.soundEvent) {
       this.perceptionGraphics.lineStyle(2, 0xe5b454, 0.8);
```

**Lineas netas añadidas**: +27 (23 constantes + 4 en drawPerception)
**Lineas modificadas**: 4 (seleccion estilo, fillStyle, lineStyle, strokePath)
**Archivos tocados**: 1 (`GameScene.ts`)

---

## Limitaciones

1. **Cono no recortado por oclusion**: El cono dibuja el alcance teorico completo (radio 220px, 90 grados). Cuando hay pared, el cono se ve "atravesando" la pared aunque el HUD muestre `OCLUIDO`. Esto es consistente con la spec (no recortar visualmente).

2. **HUD y cono pueden discrepar temporalmente**: El HUD muestra `estado PERSEGUIR` por memoria visual (`lastKnownPosition`) mientras el cono ya volvio a reposo (`visible: false`). Esto es correcto: cono = percepcion actual; HUD = estado FSM + memoria.

3. **Sin animacion**: Cambio inmediato frame-a-frame. En transiciones muy rapidas puede parpadear. No se anadio tween por restriccion de alcance.

4. **Colores hardcoded**: Paletas definidas como constantes en el archivo. No son configurables ni temas.

5. **Chunk size warning**: Build advierte chunk >500kB (preexistente, no introducido por este cambio).

---

## Decisiones humanas registradas

| Decision | Justificacion | Registrada por |
|---|---|---|
| Alcance solo en `GameScene.drawPerception` | Mantener separacion dominio/Phaser; no tocar logica de deteccion | Estudiante (spec) |
| Sin `computeVisionConeGeometry` en dominio | Geometria ya existe implicita en `arc()`; duplicar anade complejidad sin valor | Estudiante (spec) |
| Cambio inmediato sin tween | Alcance minimo; feedback visual ya claro con paletas distintas | Estudiante (spec) |
| Sin indicador en jugador | Cono suficiente para este upgrade; evitar feature creep | Estudiante (spec) |
| Paletas: Reposo=azul/Alerta=rojo | Rojo = advertencia universal; azul = neutro; contraste claro | Estudiante (impl) |
| Alpha fill: 0.12 / 0.25 | Diferencia perceptible sin saturar; mantiene visibilidad mapa | Estudiante (impl) |
| Stroke width: 2 / 3 | Borde grueso en alerta refuerza "detectado" | Estudiante (impl) |

---

## Recomendacion final

### OK. INTEGRAR

**Justificacion**:
- Criterios de aceptacion verificados: CA-01, CA-02, CA-03, CA-05, CA-06 cumplidos
- CA-04 (transicion inmediata) PENDIENTE de comprobacion manual especifica
- Validacion completa pasa (`npm run validate` = OK)
- Regresion cero: 48/48 tests preexistentes pasan
- Cambio minimo: 1 archivo, 27 lineas netas, solo presentacion visual
- Respeta todas las restricciones: sin dominio, sin FSM, sin deps, sin tween, sin indicador jugador
- Feedback visual claro: el jugador distingue reposo vs alerta sin ambigüedad

**Proximos pasos sugeridos** (fuera de este upgrade):
1. Agregar `node_modules/` y `dist/` a `.gitignore` (higiene repo)
2. Considerar tema de colores centralizado si hay mas upgrades visuales
3. Evaluar tween opcional en upgrade futuro si el parpadeo molesta
4. Completar verificacion manual de CA-04 (transicion inmediata) en proxima sesion

---

**Evidencia completada.** No se requieren commits adicionales en este momento.