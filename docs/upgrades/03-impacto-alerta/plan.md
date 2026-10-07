# Plan de implementación: Upgrade 03 - Impacto visual extremo de alerta

## 1. Estado inicial

### Dónde se detecta la transición hacia PERSEGUIR
- **Archivo**: `src/game/scenes/GameScene.ts`
- **Método**: `updatePerception(time: number)` líneas 375-387
- **Código clave**:
```typescript
const guardResult = computeGuardState(this.guardStatus, {
  soundHeard: frame.soundHeard,
  visionVisible: frame.vision.visible,
});

if (guardResult.transition) {
  this.guardStatus = guardResult.state;
  if (guardResult.state !== "patrullar") {
    this.patrolPauseRemainingMs = 0;
  }
  if (guardResult.state === "perseguir") {
    this.navigateToCell(worldToCell(target, TILE_SIZE));
  } else if (guardResult.state === "investigar") {
    // ...
  }
}
```
- `guardResult.transition` es non-null **solo** cuando hay cambio real de estado
- `guardResult.transition.reason === "vision"` identifica transiciones por detección visual

### Cómo se distingue transición real de permanencia
- `guardResult.transition !== null` → **entrada nueva** al estado
- `guardResult.transition === null` → **permanece** en mismo estado (ej. ya en `perseguir` con visión continua)
- No se necesita flag extra: la FSM ya provee esta información

### Cámara principal disponible
- `this.cameras.main` ya instanciada y usada en `create():118` para `setBackgroundColor`
- APIs nativas Phaser 3.90:
  - `this.cameras.main.shake(duration, intensity)` - auto-restaurable
  - `this.cameras.main.flash(duration, red, green, blue, force)` - auto-restaurable

### Cambios previos a preservar (Upgrade 01 + 02)
- **Upgrade 01**: `CONE_REPOSO`/`CONE_ALERTA`, `drawPerception` reactivo, `vision.visible` controla paleta
- **Upgrade 02**: `patrolPauseRemainingMs`, pausa en patrulla, `guardFacing` hacia siguiente punto, cancelación de pausa en transición
- Tests: 48/48 pasando, `npm run validate` OK

---

## 2. Decisión de implementación

### Alternativa elegida: APIs nativas de cámara en punto de transición

```typescript
// Dentro del bloque if (guardResult.transition)
if (guardResult.state === "perseguir" && guardResult.transition.reason === "vision") {
  this.cameras.main.shake(400, 0.015);
  this.cameras.main.flash(150, 255, 0, 0);
}
```

**Por qué esta alternativa**:
- ✅ **Mínima**: 2 líneas, sin flags, sin timers propios
- ✅ **Una vez por transición**: `guardResult.transition` ya filtra
- ✅ **Auto-restaurable**: Phaser maneja duración y restauración
- ✅ **Sin dependencias**: APIs nativas de Phaser 3
- ✅ **Sin cambios en dominio/FSM/percepción**: Solo efecto visual en GameScene

### Parámetros elegidos
| Efecto | Duración | Intensidad/Color | Justificación |
|---|---|---|---|
| Shake | 400ms | 0.015 | Visible pero no mareante; < 1s |
| Flash | 150ms | Rojo (255,0,0) | Coherente con `CONE_ALERTA`; breve |

---

## 3. Incrementos de trabajo

### Incremento 1: Disparo del camera shake
- **Objetivo**: Activar shake al transicionar a PERSEGUIR por visión
- **Archivo**: `src/game/scenes/GameScene.ts`
- **Cambio**: En `updatePerception`, dentro de `if (guardResult.transition)`, antes de navegar:
  ```typescript
  if (guardResult.state === "perseguir" && guardResult.transition.reason === "vision") {
    this.cameras.main.shake(400, 0.015);
  }
  ```
- **Criterio**: CA-01
- **Validación**: `npm run dev` → entrar en cono → verificar shake ~400ms
- **Riesgo**: Shake no se dispara o se dispara mal (parámetros)
- **Detener si**: TypeScript error, shake no visible, cámara no restaura

### Incremento 2: Disparo del flash rojo
- **Objetivo**: Activar flash rojo sincronizado con shake
- **Archivo**: `src/game/scenes/GameScene.ts` (mismo bloque)
- **Cambio**: Agregar flash en misma condición:
  ```typescript
  this.cameras.main.flash(150, 255, 0, 0);
  ```
- **Criterio**: CA-02
- **Validación**: `npm run dev` → transición → verificar flash rojo ~150ms coincidente
- **Riesgo**: Flash no visible, color incorrecto, duración errónea
- **Detener si**: Flash no se ve, color no es rojo, cámara no restaura color

### Incremento 3: Verificación de no repetición en permanencia
- **Objetivo**: Confirmar que NO se re-dispara mientras permanece en PERSEGUIR
- **Archivo**: Ninguno (validación de comportamiento existente)
- **Cambio**: Ninguno - la lógica `guardResult.transition !== null` ya previene re-disparo
- **Criterio**: CA-03 (fase 2: permanencia sin repetir)
- **Validación**: `npm run dev` → entrar en PERSEGUIR → permanecer 3s+ → verificar **sin** shake/flash adicional
- **Riesgo**: Efecto se repite cada frame (bug en condición)
- **Detener si**: Efecto se repite durante permanencia

### Incremento 4: Verificación de re-disparo en nueva transición tras reinicio
- **Objetivo**: Confirmar que SÍ se dispara en nueva transición futura a PERSEGUIR tras reinicio
- **Archivo**: Ninguno (validación de comportamiento existente)
- **Cambio**: Ninguno - tras reinicio (R), nueva transición genera nuevo `guardResult.transition` non-null
- **Criterio**: CA-03 (fase 3: re-disparo en nueva transición tras reinicio)
- **Validación**: `npm run dev` → PERSEGUIR → R (reinicio) → patrullar → entrar en cono → verificar efecto 2
- **Riesgo**: Estado residual impide nueva transición tras reinicio (improbable, `scene.restart()` limpia todo)
- **Detener si**: Nueva transición tras reinicio no dispara efecto

### Incremento 5: Regresión y validación completa
- **Objetivo**: Confirmar que nada se rompió
- **Validaciones**:
  - CA-04: Sonido (Q) → INVESTIGAR → **sin** efecto
  - CA-05: Cámara restaura posición/color tras efectos
  - CA-06: `npm run test:run` → 48/48
  - CA-07: `npm run validate` → OK
  - `git diff src/game/scenes/GameScene.ts` → solo cambios en `updatePerception`
- **Riesgo**: Regresión en tests o build
- **Detener si**: Algún test falla, build falla, diff incluye archivos no previstos

---

## 4. Validación prevista

| Paso | Acción | Comando / Pasos | Resultado esperado |
|---|---|---|---|
| **V-01** | Patrullar → Perseguir (visión) | `npm run dev` → mover jugador a cono | Shake 400ms + Flash 150ms rojo al cambiar HUD a PERSEGUIR |
| **V-02** | Investigar → Perseguir (visión) | `npm run dev` → Q → entrar en cono | Shake + Flash al cambiar HUD a PERSEGUIR |
| **V-03** | Permanencia sin repetir | `npm run dev` → PERSEGUIR → esperar 3s+ | **Sin** shake/flash adicional |
| **V-04** | Nueva transición → Perseguir (tras reinicio) | `npm run dev` → PERSEGUIR → R → patrullar → entrar en cono | Shake + Flash **nuevamente** |
| **V-05** | Sonido sin efecto | `npm run dev` → Q → INVESTIGAR | **Sin** shake/flash |
| **V-06** | Cámara restaurada | `npm run dev` → provocar efecto → esperar 1s | Posición y color idénticos a antes |
| **V-07** | Tests regresión | `npm run test:run` | 48/48 pass |
| **V-08** | Validación completa | `npm run validate` | typecheck + test + build OK |
| **V-09** | Diff final | `git diff src/game/scenes/GameScene.ts` | Solo líneas en `updatePerception` |

---

## 5. Evidencia a registrar en `docs/upgrades/03-impacto-alerta/evidencia.md`

Para cada validación:

```
### V-XX: [Nombre]
- **Transición provocada**: [ej. patrullar → perseguir (visión)]
- **Reproducción**: [pasos exactos con teclas]
- **Efecto observado**: [shake/flash sí/no, duración, color]
- **Duración aproximada**: [ms observados]
- **Cámara restaurada**: [sí/no - posición y color]
- **Resultado real**: [pendiente]
```

Ejemplo CA-03 (fases completas con reinicio):
```
### CA-03: Un solo disparo por transición; re-disparo en nueva transición tras reinicio
- **Transición provocada**: Secuencia completa (entrada → permanencia → reinicio → nueva entrada)
- **Reproducción**:
  1. `npm run dev`
  2. Entrar en cono → PERSEGUIR (efecto 1)
  3. Permanecer 3+ segundos (verificar **sin** efecto)
  4. Presionar R (reiniciar escena)
  5. Entrar en cono → PERSEGUIR (efecto 2)
- **Efecto observado**: Efecto 1 en paso 2; **ninguno** en paso 3; Efecto 2 en paso 5
- **Duración aproximada**: [ms por efecto]
- **Cámara restaurada**: [sí/no tras cada efecto]
- **Resultado real**: [pendiente]
```

**Limitación registrada**: La FSM actual no implementa retorno desde PERSEGUIR a PATRULLAR ni estado de captura/regreso; es comportamiento preexistente y queda fuera del alcance de este upgrade.

---

## 6. Restricciones reiteradas

- ✅ Solo `GameScene.ts` (método `updatePerception`)
- ✅ Sin flags persistentes, sin timers propios
- ✅ Sin cambios en `guardState.ts`, `perception.ts`, `memory.ts`, `pathFollower.ts`
- ✅ Sin dependencias nuevas
- ✅ APIs nativas `camera.shake()` + `camera.flash()`
- ✅ `npm run validate` debe pasar

---

**¿Aprobás este plan para proceder con el Incremento 1 (disparo del shake)?**