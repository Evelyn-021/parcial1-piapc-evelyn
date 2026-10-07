# Especificación: Upgrade 04 - Distractores sonoros interactivos

## Problema
El sonido emitido por el jugador (Q) funciona mecánicamente pero su feedback visual es pasivo: solo un círculo amarillo estático que aparece/disaparece. El jugador no percibe claramente cuándo el sonido es una "herramienta de distracción" efectiva ni si el guardia realmente lo oyó.

## Intención
Que el sonido sea una herramienta de distracción legible: el jugador vea claramente dónde emitió el sonido, si el guardia lo oyó, y la reacción sea observable sin cambiar la lógica de percepción ni FSM.

## Objetivo
Mejorar la legibilidad visual del distractor sonoro existente, añadiendo feedback que haga obvio:
1. Dónde se generó el sonido (posición clara)
2. Si el guardia lo oyó (reacción observable)
3. Cuánto dura el efecto (desaparición automática)

Sin cambiar lógica de percepción, FSM, pathfinding, ni prioridad visión > sonido.

## Alcance
- **Incluye**:
  - Pulso/animación del círculo de sonido al emitirse (feedback de "se generó aquí")
  - Indicador visual de "oído/no oído" sincronizado con `soundHeard`
  - Desaparición automática al expirar `soundEvent` (ya existe, se preserva)
  - Conservar Q, radio 190, duración 800ms, prioridad visión > sonido
- **No incluye**:
  - Cooldown, inventario, tipos de sonido
  - Cambios en `evaluateSound`, `computeGuardState`, `guardState.ts`
  - Cambios en pathfinding (`advanceAlongPath`, `calculateRoute`)
  - Nuevos estados FSM o partículas

## Fuera de alcance
- Modificar `perception.ts`, `memory.ts`, `guardState.ts`
- Cambiar reglas de percepción o prioridad visión/sonido
- Agregar dependencias
- Cooldown o límite de uso de Q
- Sistema de inventario de distractores

## Restricciones
- **Técnicas**: Phaser 3.90.0, TypeScript 5.9.3 strict, dominio puro sin Phaser
- **Calidad**: `npm run validate` debe pasar (typecheck + test + build)
- **Operativas**: Solo `GameScene.ts` (feedback visual en `drawPerception`)
- **Regresión**: 48 tests existentes deben pasar
- **Arquitectura**: Sin cambios en dominio, FSM, percepción, pathfinding

## Caso normal
**Jugador emite sonido y guardia lo oye**
- Dado: Guardia patrullando, jugador fuera de visión, dentro de radio 190
- Cuando: Jugador presiona Q
- Entonces:
  1. Se crea `soundEvent` en posición jugador (radio 190, 800ms)
  2. Círculo amarillo aparece con **pulso visible** (feedback de emisión)
  3. Guardia evalúa sonido → `soundHeard=true`
  4. FSM transiciona `patrullar` → `investigar` (razón "sound")
  5. Guardia navega hacia posición del sonido
  6. Círculo muestra estado "oído" (ej. fill + stroke)
  7. Tras 800ms: evento expira, círculo desaparece automáticamente

## Caso límite
| Caso | Descripción | Comportamiento esperado |
|---|---|---|
| **Sonido fuera de radio** | Jugador emite Q, guardia a >190px | Círculo aparece con pulso; HUD `sonido FUERA DE RANGO`; **sin transición** a INVESTIGAR |
| **Visión simultánea** | Jugador en cono (visión válida) + dentro de radio sonoro 190px + presiona Q mismo frame | Prioridad visión: transición a `perseguir` (shake+flash Upgrade 03); sonido se ignora para FSM |
| **Sonido expira antes de llegar** | Guardia camina hacia sonido, evento expira en camino | Guardia continúa hacia última posición conocida (memoria sound); círculo desaparece |
| **Múltiples Q rápidos** | Jugador presiona Q varias veces < 800ms | `withSoundEvent` reemplaza evento; último Q reinicia timer 800ms; un solo círculo visible |
| **Reinicio (R)** | `scene.restart()` durante sonido activo | Sonido cancelado; estado limpio al reiniciar |

## Criterios de aceptación verificables

| ID | Criterio | Pasos de reproducción | Resultado esperado |
|---|---|---|---|
| **CA-01** | Pulso visual al emitir sonido | 1. `npm run dev`<br>2. Jugador presiona Q<br>3. Observar círculo en posición jugador | Círculo amarillo aparece con **pulso/animación** al emitir |
| **CA-02** | Feedback "oído" cuando guardia oye | 1. `npm run dev`<br>2. Guardia dentro de radio 190<br>3. Q → esperar frame evaluación<br>4. Observar círculo | Círculo cambia a estado "oído" (ej. fill amarillo + stroke) |
| **CA-03** | Transición a INVESTIGAR observable | 1. `npm run dev`<br>2. Guardia patrullando, en radio<br>3. Q → HUD `estado INVESTIGAR`<br>4. Guardia camina hacia sonido | Estado `INVESTIGAR` en HUD; guardia navega a posición sonido |
| **CA-04** | Sin transición si fuera de radio | 1. `npm run dev`<br>2. Guardia a >190px<br>3. Q → HUD `sonido FUERA DE RANGO` | **Sin transición** a INVESTIGAR; estado mantiene `patrullar` |
| **CA-05** | Prioridad visión sobre sonido | 1. `npm run dev`<br>2. Jugador en cono (visión válida) Y dentro de radio 190px (sonido válido)<br>3. Presionar Q mismo frame<br>4. HUD `estado PERSEGUIR`<br>5. Shake+flash (Upgrade 03) | **PERSEGUIR** (no INVESTIGAR); shake+flash se disparan por visión |
| **CA-06** | Desaparición automática | 1. `npm run dev`<br>2. Q → esperar > 800ms sin nuevo Q<br>3. Observar círculo | Círculo **desaparece** tras ~800ms; `soundEvent=null` |
| **CA-07** | Múltiples Q reinician evento | 1. `npm run dev`<br>2. Q → antes de expirar, Q nuevamente<br>3. Observar distractor visible | Un solo círculo visible correspondiente al **último Q**; permanece activo durante su duración; luego desaparece automáticamente |
| **CA-08** | Regresión: tests pasan | `npm run test:run` | 48/48 tests pasan |
| **CA-09** | Validación completa | `npm run validate` | typecheck + test + build = OK |

## Evidencia prevista por criterio

Para cada CA se registrará en `docs/upgrades/04-distractor-sonoro/evidencia.md`:

```
### CA-01: Pulso visual al emitir
- **Sonido emitido**: Q presionado en posición jugador
- **Reproducción**: 
  1. `npm run dev`
  2. Jugador quieto, presionar Q
- **Efecto observado**: Círculo amarillo con pulso/animación en posición jugador
- **¿Fue oído?**: [sí/no según distancia guardia]
- **Estado resultante**: [patrullar/investigar/perseguir]
- **Feedback visual**: Pulso visible en círculo
- **Prioridad visión > sonido**: N/A
- **npm run test:run**: [output]
- **npm run validate**: [output]

### CA-03: Transición a INVESTIGAR
- **Sonido emitido**: Q con guardia en radio 190
- **Reproducción**: 
  1. `npm run dev`
  2. Posicionar guardia a ~100px del jugador
  3. Presionar Q
- **Efecto observado**: Círculo pasa a estado "oído"; HUD `estado INVESTIGAR`; guardia camina hacia círculo
- **¿Fue oído?**: sí
- **Estado resultante**: INVESTIGAR
- **Feedback visual**: Círculo con fill amarillo + stroke
- **Prioridad visión > sonido**: N/A
- **npm run test:run**: [output]
- **npm run validate**: [output]

### CA-05: Prioridad visión sobre sonido
- **Sonido emitido**: Q con jugador en cono de visión Y dentro de radio 190px
- **Reproducción**: 
  1. `npm run dev`
  2. Posicionar jugador dentro del cono de visión del guardia Y a <190px
  3. Presionar Q mismo frame
- **Efecto observado**: HUD `estado PERSEGUIR`; shake+flash (Upgrade 03); **sin** INVESTIGAR
- **¿Fue oído?**: [ambos estímulos válidos, visión tiene prioridad]
- **Estado resultante**: PERSEGUIR
- **Feedback visual**: Shake + flash rojo (Upgrade 03)
- **Prioridad visión > sonido**: SÍ - visión ganó
- **npm run test:run**: [output]
- **npm run validate**: [output]

### CA-07: Múltiples Q reinician evento
- **Sonido emitido**: Q → antes de expirar, Q nuevamente
- **Reproducción**: 
  1. `npm run dev`
  2. Presionar Q
  3. Antes de que expire el evento (800ms), presionar Q nuevamente
  4. Observar distractor visible
- **Efecto observado**: Un solo círculo visible correspondiente al último Q; permanece activo durante su nueva duración; luego desaparece automáticamente
- **¿Fue oído?**: [sí/no según distancia guardia]
- **Estado resultante**: [según percepción]
- **Feedback visual**: Círculo correspondiente al último evento
- **Prioridad visión > sonido**: N/A
- **npm run test:run**: [output]
- **npm run validate**: [output]
```