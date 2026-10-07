# Especificación: Upgrade 01 - Cono de visión visible y reactivo

## Problema
El cono de visión actual en `GameScene.drawPerception()` se dibuja pero no comunica claramente al jugador cuándo está siendo detectado. Solo cambia sutilmente el color de relleno (verde 0x73c991 si visible, azul 0x6b8afd si no, ambos con α=0.16), sin feedback visual fuerte al cruzar el límite de detección real.

## Intención
Que el jugador note de forma inmediata y clara cuándo entra o sale del campo de visión del guardia, usando exclusivamente el cono existente y el resultado de percepción ya calculado.

## Objetivo
Modificar `GameScene.drawPerception()` para que el cono tenga dos estados visuales distintos y bien diferenciados:
- **Reposo** (`VisionResult.visible === false`): aspecto neutro
- **Alerta/Detección** (`VisionResult.visible === true`): aspecto de advertencia clara

Sin alterar lógica de detección, FSM, dominio, ni agregar dependencias.

## Alcance
- **Incluye**:
  - Cambio en `src/game/scenes/GameScene.ts` → `drawPerception(vision: VisionResult)`
  - Dos paletas visuales definidas como constantes locales (reposo / alerta)
  - Cambio inmediato de color, alpha y grosor de borde según `vision.visible`
  - Uso exclusivo de `vision.visible` (boolean) y `vision.reason` (para debug/HUD existente)
- **No incluye**:
  - Helpers geométricos nuevos en `perception.ts`
  - Modificaciones a `evaluateVision`, `perceptionSimulation`, `guardState`, FSM
  - Tween/animaciones de transición
  - Indicador adicional sobre el jugador
  - Tests nuevos de geometría
  - Recorte visual por oclusión

## Fuera de alcance
- Cualquier cambio en dominio (`src/domain/`)
- Cambios en simulación (`src/application/simulation/`)
- Nuevas dependencias
- Cambios en arquitectura o separación dominio/Phaser

## Restricciones
- **Técnicas**: Phaser 3.90.0, TypeScript 5.9.3 strict, dominio puro sin Phaser
- **Calidad**: `npm run validate` debe pasar (typecheck + test + build)
- **Operativas**: Solo modificar `GameScene.ts` en la función `drawPerception`
- **Regresión**: Tests existentes de percepción (12) y FSM (10) deben seguir pasando

## Casos relevantes

### Caso normal 1: Jugador entra al campo visual
- **Dado**: Guardia patrullando, jugador fuera de cono/rango
- **Cuando**: Jugador se mueve hasta que `evaluateVision` retorna `visible: true`
- **Entonces**: Cono cambia inmediatamente a estado "alerta" (color/alpha/borde de advertencia)

### Caso normal 2: Jugador sale del campo visual
- **Dado**: Guardia detectando al jugador (`visible: true`)
- **Cuando**: Jugador se mueve fuera de rango/cono/tras pared → `visible: false`
- **Entonces**: Cono vuelve inmediatamente a estado "reposo"

### Caso límite: Jugador geométricamente dentro pero ocluido por pared
- **Dado**: Jugador en rango y ángulo del cono, pero pared entre medio
- **Cuando**: `evaluateVision` retorna `visible: false, reason: "occluded"`
- **Entonces**: Cono muestra estado "reposo" (no alerta), consistente con resultado real

### Regresión: FSM y percepción inalteradas
- **Dado**: Juego ejecutándose
- **Cuando**: Se producen transiciones Patrullar→Investigar→Perseguir por sonido/visión
- **Entonces**: Comportamiento idéntico a antes del cambio (validado por tests existentes)

## Criterios de aceptación verificables

| ID | Criterio | Pasos de reproducción | Resultado esperado |
|---|---|---|---|
| **CA-01** | Cono en reposo cuando `visible: false` | 1. `npm run dev`<br>2. Posicionar jugador fuera de cono (ej. esquina opuesta)<br>3. Observar cono | Cono con paleta "reposo": color neutro, alpha bajo, borde fino |
| **CA-02** | Cono en alerta cuando `visible: true` | 1. `npm run dev`<br>2. Mover jugador dentro del cono sin paredes de por medio<br>3. Observar cono | Cono con paleta "alerta": color de advertencia, alpha alto, borde grueso |
| **CA-03** | Cono en reposo cuando `reason: "occluded"` | 1. `npm run dev`<br>2. Colocar jugador tras pared pero en rango/cono geométrico<br>3. Verificar HUD: `vision OCLUIDO`<br>4. Observar cono | Cono con paleta "reposo" (no alerta) |
| **CA-04** | Transición inmediata sin tween | 1. `npm run dev`<br>2. Cruzar límite del cono repetidamente<br>3. Observar cambio | Cambio instantáneo de paleta (sin animación intermedia) |
| **CA-05** | Tests de regresión pasan | `npm run test:run` | 48 tests pasan (12 percepción + 10 guardState + 26 otros) |
| **CA-06** | Validación completa pasa | `npm run validate` | typecheck + test + build = OK |

## Evidencia prevista por criterio

Para cada CA se registrará en `docs/upgrades/01-cono-vision-reactivo/evidencia.md`:

```
### CA-01: Cono en reposo (visible: false)
- **Caso ejecutado**: Jugador fuera del campo visual del guardia
- **Reproducción**:
  1. `npm run dev`
  2. Mover jugador (WASD) a posición (x≈100, y≈100) - esquina superior izquierda
  3. Guardia patrulla en zona inferior derecha
- **Resultado esperado**: Cono renderizado con paleta reposo (color neutro, α≈0.12, borde 2px)
- **Resultado real observado**: [completar tras implementación]
- **Caso límite verificado**: N/A
- **Salida npm run validate**: [pegar output completo]

### CA-02: Cono en alerta (visible: true)
- **Caso ejecutado**: Jugador dentro del campo visual sin oclusión
- **Reproducción**:
  1. `npm run dev`
  2. Mover jugador hacia guardia hasta entrar en cono (aprox. 220px, ángulo ±45° del facing)
  3. Verificar HUD: `vision VISIBLE`
- **Resultado esperado**: Cono renderizado con paleta alerta (color advertencia, α≈0.25, borde 3px)
- **Resultado real observado**: [completar tras implementación]
- **Caso límite verificado**: N/A
- **Salida npm run validate**: [pegar output completo]

### CA-03: Oclusión mantiene reposo
- **Caso ejecutado**: Jugador geométricamente en cono pero pared intermedia
- **Reproducción**:
  1. `npm run dev`
  2. Posicionar guardia y jugador con pared entre ambos (usar laberinto labLevel.ts)
  3. Verificar HUD: `vision OCLUIDO`
- **Resultado esperado**: Cono con paleta reposo (no alerta)
- **Resultado real observado**: [completar tras implementación]
- **Caso límite verificado**: `reason === "occluded"` con geometría favorable
- **Salida npm run validate**: [pegar output completo]

### CA-05/06: Regresión y validación
- **Caso ejecutado**: Suite completa de tests y build
- **Reproducción**: `npm run validate`
- **Resultado esperado**: 48 tests pasan, typecheck OK, build OK
- **Resultado real observado**: [pegar output completo]
- **Caso límite verificado**: Transiciones FSM manuales (Q para sonido, movimiento para visión)
- **Salida npm run validate**: [pegar output completo]
```