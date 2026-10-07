# Plan de implementación: Upgrade 04 - Distractores sonoros interactivos

## 1. Estado inicial

### Cómo se crea soundEvent
- **Archivo**: `GameScene.ts:212-219`
- **Trigger**: `Phaser.Input.Keyboard.JustDown(this.emitSound)` (tecla Q)
- **Creación**: `withSoundEvent(this.perceptionState, { position: {x: player.x, y: player.y}, radius: SOUND_RADIUS (190), emittedAtMs: time, durationMs: SOUND_DURATION_MS (800) })`
- **Almacenamiento**: `this.perceptionState.soundEvent` (tipo `SoundEvent | null`)

### Datos temporales de soundEvent
```typescript
interface SoundEvent {
  readonly position: Vector2;      // dónde se generó
  readonly radius: number;         // 190
  readonly emittedAtMs: number;    // timestamp de creación
  readonly durationMs: number;     // 800
}
```
- `soundEvent.active` se deriva en `evaluateSound`: `currentTimeMs <= emittedAtMs + durationMs`
- Al expirar, `updatePerceptionSimulation` pone `soundEvent = null`

### Cómo drawPerception dibuja actualmente el círculo
- **Archivo**: `GameScene.ts:420-427`
- **Código**:
```typescript
if (this.perceptionState.soundEvent) {
  this.perceptionGraphics.lineStyle(2, 0xe5b454, 0.8);
  this.perceptionGraphics.strokeCircle(
    this.perceptionState.soundEvent.position.x,
    this.perceptionState.soundEvent.position.y,
    this.perceptionState.soundEvent.radius,
  );
}
```
- **Estilo actual**: Solo stroke amarillo (0xe5b454), grosor 2, alpha 0.8
- **Sin fill**, sin animación, sin diferenciación oído/no oído

### Cómo se obtiene soundHeard
- **En `updatePerception`** (`GameScene.ts:370-373`):
```typescript
const frame = updatePerceptionSimulation(this.perceptionState, { ... });
const guardResult = computeGuardState(this.guardStatus, {
  soundHeard: frame.soundHeard,   // ← viene del frame
  visionVisible: frame.vision.visible,
});
```
- **En `updatePerceptionSimulation`** (`perceptionSimulation.ts:56-58`):
```typescript
const sound = evaluateSound(input.observer, soundEvent, input.timeMs);
soundHeard = sound.heard;  // true si active && distance <= radius
```

### Cómo se conserva la prioridad visión > sonido
- **En `guardState.ts:29-36`**: `visionVisible` se evalúa primero; si true → `perseguir` inmediato
- **En `updatePerception`** (`GameScene.ts:380-382`): shake+flash solo si `reason === "vision"`
- **No se toca**: FSM, `evaluateSound`, `computeGuardState`, `evaluateVision`

### Cambios previos a preservar (Upgrades 01-03)
- **Upgrade 01**: Conos `CONE_REPOSO`/`CONE_ALERTA`, `drawPerception` reactivo
- **Upgrade 02**: `patrolPauseRemainingMs`, pausa patrulla, `guardFacing` hacia siguiente punto, cancelación pausa en transición
- **Upgrade 03**: Shake+flash en transición a `perseguir` por visión (`GameScene.ts:380-382`)

---

## 2. Decisión de implementación

### Alternativas para pulso visual del círculo

| Opción | Descripción | Pros | Contras |
|---|---|---|---|
| **A. Radio pulsante basado en tiempo** | `radius * (1 + sin(time * freq) * amplitude)` en `drawPerception` | Separa pulso del estilo oído/no oído; usa `timeMs` disponible | Requiere pasar `time` a `drawPerception` |
| **B. Tween de Phaser** | `this.tweens.add({ targets: graphics, ... })` | Nativo Phaser, suave | Crea tween persistente, más complejo limpiar |
| **C. Alpha pulsante** | `alpha = base + sin(...) * amplitude` | Simple | Conflicta con estilo oído/no oído (alpha fijo) |

### Alternativas para oído/no oído

| Opción | Descripción |
|---|---|
| **A. Fill condicional** | `soundHeard ? fillStyle + stroke fuerte : solo stroke tenue` |
| **B. Color condicional** | `soundHeard ? amarillo fuerte : amarillo tenue` |
| **C. Stroke width** | `soundHeard ? 4 : 2` |

### Decisión elegida: **Radio pulsante + Fill condicional** (cálculo por tiempo en `drawPerception`)

**Por qué**:
- ✅ **Mínima**: Solo modifica `drawPerception` y pasa `time` + `soundHeard`
- ✅ **Sin timers/tweens propios**: Usa `timeMs` del frame actual y `soundEvent.emittedAtMs`
- ✅ **Un solo draw call**: Extiende lógica existente en `drawPerception`
- ✅ **Auto-limpio**: Al expirar `soundEvent`, no dibuja nada (comportamiento actual preservado)
- ✅ **Sin GameObjects nuevos**: Reutiliza `perceptionGraphics` existente
- ✅ **Separación clara**: Pulso = escala del radio; Oído/No oído = fill + stroke width

### Parámetros de pulso (implementación en `drawPerception`)
```typescript
const elapsed = time - soundEvent.emittedAtMs;
const pulsePhase = (elapsed % 400) / 400;  // ciclo 400ms
const pulseScale = 1 + Math.sin(pulsePhase * Math.PI * 2) * 0.06;  // ±6%
const displayRadius = soundEvent.radius * pulseScale;
```
- Frecuencia: ~2.5 Hz (400ms ciclo)
- Amplitud: ±6% del radio (visible, no distractivo)
- **El pulso afecta el radio, no el alpha** → no conflictúa con estilo oído/no oído

### Diferenciación oído/no oído (usa `displayRadius`)
```typescript
if (soundHeard) {
  // Oído: fill amarillo + stroke grueso
  graphics.fillStyle(0xe5b454, 0.25);
  graphics.fillCircle(x, y, displayRadius);
  graphics.lineStyle(3, 0xe5b454, 0.9);
} else {
  // No oído: solo stroke tenue
  graphics.lineStyle(2, 0xe5b454, 0.6);
}
graphics.strokeCircle(x, y, displayRadius);
```
- Ambos usan `displayRadius` → pulso siempre visible
- `soundHeard=true`: fill amarillo (alpha 0.25) + stroke 3px alpha 0.9
- `soundHeard=false`: solo stroke 2px alpha 0.6 (estilo actual preservado)

---

## 3. Incrementos de trabajo

### Incremento 1: Pulso visual del distractor
- **Objetivo**: Círculo de sonido pulsa al emitirse (radio oscila)
- **Archivo**: `src/game/scenes/GameScene.ts`
- **Cambio**:
  1. `drawPerception(vision, soundHeard, time)` → agregar parámetros `soundHeard: boolean, time: number`
  2. En `updatePerception`: pasar `frame.soundHeard, time` al llamar `drawPerception`
  3. En `drawPerception`: calcular `displayRadius` con escala pulsante usando `time - soundEvent.emittedAtMs`
  4. Usar `displayRadius` en `strokeCircle` y `fillCircle`
- **Criterio**: CA-01
- **Validación**: `npm run dev` → Q → observar pulso en círculo (radio oscila ±6%)
- **Riesgo**: Cálculo de tiempo incorrecto, pulso no visible
- **Detener si**: TypeScript error, círculo no pulsa, performance degradada

### Incremento 2: Diferenciación oído/no oído
- **Objetivo**: Círculo cambia visualmente según `soundHeard`
- **Archivo**: `src/game/scenes/GameScene.ts` (mismo `drawPerception`)
- **Cambio**: En bloque de dibujo de sonido, condicional por `soundHeard`:
  - `true`: fill amarillo (0xe5b454, alpha 0.25) + stroke 3px alpha 0.9
  - `false`: solo stroke 2px alpha 0.6 (estilo actual)
- **Criterio**: CA-02
- **Validación**: `npm run dev` → Q con guardia en radio → círculo con fill; Q con guardia fuera → solo stroke
- **Riesgo**: Fill oculta otros elementos, alpha incorrecto
- **Detener si**: Fill oculta cono/guardia, estilo no cambia

### Incremento 3: Verificación desaparición automática
- **Objetivo**: Confirmar que círculo desaparece al expirar evento (ya implementado)
- **Archivo**: Ninguno (validación de comportamiento existente)
- **Criterio**: CA-06
- **Validación**: `npm run dev` → Q → esperar > 800ms → círculo desaparece
- **Riesgo**: `soundEvent` no se limpia (bug preexistente)
- **Detener si**: Círculo persiste tras 800ms

### Incremento 4: Verificación múltiples Q
- **Objetivo**: Confirmar que Q repetido reinicia evento sin acumular círculos
- **Archivo**: Ninguno (validación de comportamiento existente - `withSoundEvent` reemplaza)
- **Criterio**: CA-07
- **Validación**: `npm run dev` → Q → esperar 400ms → Q → un solo círculo visible → desaparece tras 800ms del último Q
- **Riesgo**: `withSoundEvent` no reemplaza correctamente
- **Detener si**: Múltiples círculos visibles, timer no reinicia

### Incremento 5: Validación prioridad visión > sonido
- **Objetivo**: Confirmar que visión gana sobre sonido simultáneo
- **Archivo**: Ninguno (validación de comportamiento existente - FSM intacta)
- **Criterio**: CA-05
- **Validación**: `npm run dev` → jugador en cono + radio 190 → Q → HUD `PERSEGUIR` + shake+flash (Upgrade 03)
- **Riesgo**: Regresión en Upgrade 03
- **Detener si**: Transiciona a INVESTIGAR, no hay shake+flash

### Incremento 6: Regresión y diff final
- **Objetivo**: Confirmar nada roto
- **Validaciones**:
  - CA-03: Transición a INVESTIGAR observable
  - CA-04: Sin transición si fuera de radio
  - CA-08: `npm run test:run` → 48/48
  - CA-09: `npm run validate` → OK
  - `git diff src/game/scenes/GameScene.ts` → solo `drawPerception` + llamada en `updatePerception`
- **Riesgo**: Regresión en tests o Upgrades 01-03
- **Detener si**: Test falla, build falla, diff incluye archivos no previstos

---

## 4. Validación prevista

| Paso | Acción | Comando / Pasos | Resultado esperado |
|---|---|---|---|
| **V-01** | Pulso al emitir | `npm run dev` → Q → observar círculo | Círculo pulsa (radio oscila ±6%) |
| **V-02** | Oído vs no oído | `npm run dev` → Q con guardia en radio vs fuera | Fill + stroke grueso si oído; solo stroke si no |
| **V-03** | Transición INVESTIGAR | `npm run dev` → guardia en radio → Q → HUD | `estado INVESTIGAR`; guardia navega a círculo |
| **V-04** | Prioridad visión | `npm run dev` → en cono + radio → Q | `PERSEGUIR` + shake+flash; **no** INVESTIGAR |
| **V-05** | Desaparición auto | `npm run dev` → Q → esperar > 800ms | Círculo desaparece |
| **V-06** | Múltiples Q | `npm run dev` → Q → 400ms → Q → 1 círculo | Un solo círculo, timer reiniciado |
| **V-07** | Fuera de radio | `npm run dev` → guardia >190px → Q | HUD `sonido FUERA DE RANGO`; sin INVESTIGAR |
| **V-08** | Tests regresión | `npm run test:run` | 48/48 pass |
| **V-09** | Validación completa | `npm run validate` | typecheck + test + build OK |
| **V-10** | Diff final | `git diff src/game/scenes/GameScene.ts` | Solo `drawPerception` + llamada en `updatePerception` |

---

## 5. Evidencia a registrar en `docs/upgrades/04-distractor-sonoro/evidencia.md`

Para cada validación:

```
### V-XX: [Nombre]
- **Sonido emitido**: Q presionado en [posición]
- **Reproducción**: [pasos exactos]
- **Efecto observado**: [pulso sí/no, fill sí/no, shake+flash sí/no]
- **¿Fue oído?**: [sí/no]
- **Estado resultante**: [patrullar/investigar/perseguir]
- **Feedback visual**: [pulso, fill, shake+flash, etc.]
- **Prioridad visión > sonido**: [sí/no/N/A]
- **npm run test:run**: [output]
- **npm run validate**: [output]
```

Ejemplo CA-05 (prioridad visión):
```
### CA-05: Prioridad visión sobre sonido
- **Sonido emitido**: Q con jugador en cono Y radio 190px
- **Reproducción**: 
  1. `npm run dev`
  2. Posicionar jugador en cono de visión Y a <190px del guardia
  3. Presionar Q mismo frame
- **Efecto observado**: HUD `estado PERSEGUIR`; shake+flash (Upgrade 03); **sin** INVESTIGAR
- **¿Fue oído?**: [ambos estímulos válidos, visión tiene prioridad]
- **Estado resultante**: PERSEGUIR
- **Feedback visual**: Shake + flash rojo (Upgrade 03)
- **Prioridad visión > sonido**: SÍ - visión ganó
- **npm run test:run**: [output]
- **npm run validate**: [output]
```

---

## 6. Restricciones reiteradas

- ✅ Solo `GameScene.ts` (`drawPerception` + llamada en `updatePerception`)
- ✅ Sin timers/tweens propios
- ✅ Sin GameObjects nuevos
- ✅ Sin cambios en `perception.ts`, `memory.ts`, `guardState.ts`, `pathFollower.ts`
- ✅ Sin dependencias nuevas
- ✅ `npm run validate` debe pasar
- ✅ Upgrades 01-03 preservados

---

**¿Aprobás este plan para proceder con el Incremento 1 (pulso visual)?**