# Especificación: Upgrade 05 - Medidor de alerta y estados del nivel

## Problema
El HUD actual muestra el estado del guardia solo como texto ("estado PATRULLAR/INVESTIGAR/PERSEGUIR"). No hay una representación visual inmediata del nivel de alerta que permita al jugador percibir de un vistazo la intensidad de la amenaza.

## Intención
Agregar un medidor visual simple y discreto que represente el nivel de alerta actual del guardia (bajo/medio/alto) de forma directa y legible, reutilizando el estado FSM existente sin modificar su lógica.

## Objetivo
Agregar un indicador visual simple (barra horizontal) en el HUD que muestre:
- PATRULLAR → alerta baja (33%)
- INVESTIGAR → alerta media (66%)
- PERSEGUIR → alerta alta (100%)
Con cambio directo al cambiar `guardStatus`, sin interpolación, sin lógica nueva en dominio.

## Alcance
- **Incluye**:
  - Barra horizontal simple en HUD (Phaser.Graphics)
  - 3 niveles fijos: 33% (patrullar), 66% (investigar), 100% (perseguir)
  - Colores: verde (bajo), amarillo (medio), rojo (alto)
  - Posición: debajo del HUD actual (`navigationHud`)
  - Actualización directa en `updateTelemetry()` leyendo `this.guardStatus`
  - Reset al reiniciar escena (R)
- **No incluye**:
  - Porcentajes dinámicos calculados con percepción
  - Acumulación temporal de alerta
  - Barras que suban/bajen gradualmente (interpolaciones)
  - Timers, animaciones, partículas
  - Cambios en dominio, FSM, percepción, pathfinding
  - Dependencias nuevas

## Fuera de alcance
- Modificar `guardState.ts`, `perception.ts`, `memory.ts`, `pathFollower.ts`
- Cambiar reglas de percepción o prioridad visión/sonido
- Agregar dependencias
- Estados FSM nuevos (Buscar, Regresar, Captura)
- Acumulación de alerta temporal o "nivel de sospecha" gradual
- Animaciones de transición de la barra

## Restricciones
- **Técnicas**: Phaser 3.90.0, TypeScript 5.9.3 estricto, dominio puro sin Phaser
- **Calidad**: `npm run validate` debe pasar (typecheck + test + build)
- **Operativas**: Solo modificar `GameScene.ts` (create + updateTelemetry)
- **Regresión**: 48 tests existentes deben pasar
- **Arquitectura**: Sin cambios en dominio, FSM, percepción, pathfinding

## Caso normal
**Jugador observa medidor según estado del guardia**
- Dado: Guardia en PATRULLAR → barra 33% verde (alerta baja)
- Dado: Guardia en INVESTIGAR → barra 66% amarillo (alerta media)
- Dado: Guardia en PERSEGUIR → barra 100% rojo (alerta alta)
- El indicador cambia directamente al nuevo valor cuando cambia `guardStatus`, sin interpolación ni animación.

## Casos límite
| Caso | Descripción | Comportamiento esperado |
|------|-------------|------------------------|
| **Reinicio (R)** | `scene.restart()` durante cualquier estado | Barra vuelve a 33% verde (PATRULLAR inicial) |
| **Sonido + visión simultáneo** | Q + entrada en cono mismo frame | Barra 100% rojo (visión prioridad) |
| **Transición INVESTIGAR → PERSEGUIR** | Guardia investigando ve al jugador | Barra salta de 66% amarillo a 100% rojo directo |
| **FSM sin retorno desde PERSEGUIR** | La FSM existente no implementa retorno desde PERSEGUIR; no se modifica ese comportamiento en este upgrade | El medidor refleja el valor correspondiente al estado actual de `guardStatus` |
| **Reinicio durante PERSEGUIR** | R durante persecución | Barra resetea a 33% verde |

## Criterios de aceptación verificables

| ID | Criterio | Pasos de reproducción | Resultado esperado |
|----|----------|----------------------|-------------------|
| **CA-01** | Barra visible en HUD | 1. `npm run dev`<br>2. Observar área debajo del HUD | Barra horizontal visible debajo del HUD actual |
| **CA-02** | Correspondencia estado → nivel visual | 1. `npm run dev`<br>2. Inicio (PATRULLAR) → 33% verde<br>3. Q cerca → INVESTIGAR → 66% amarillo<br>3. Entrar en cono → PERSEGUIR → 100% rojo | Barra 33% verde (PATRULLAR), 66% amarillo (INVESTIGAR), 100% rojo (PERSEGUIR) |
| **CA-03** | Cambio directo sin interpolación | 1. `npm run dev`<br>2. Provocar transición PATRULLAR→INVESTIGAR (Q)<br>3. Observar barra | El indicador cambia directamente al nuevo valor cuando cambia `guardStatus`, sin interpolación ni animación |
| **CA-04** | Prioridad visión sobre sonido | 1. `npm run dev`<br>2. Jugador en cono (visión válida) Y dentro de radio 190px (sonido válido)<br>3. Presionar Q mismo frame<br>4. Verificar estado | `guardStatus` PERSEGUIR y medidor en nivel alto (100% rojo) |
| **CA-05** | Reset al reiniciar (R) | 1. `npm run dev`<br>2. Llegar a PERSEGUIR (100% rojo)<br>3. Presionar R | Barra resetea a 33% verde |
| **CA-06** | HUD textual preservado | 1. `npm run dev`<br>2. Verificar texto "estado PATRULLAR/INVESTIGAR/PERSEGUIR" | Texto HUD original se mantiene intacto |
| **CA-07** | Upgrades 01-04 preservados | 1. `npm run dev`<br>2. Verificar comportamientos principales de Upgrades 01-04 | Comportamientos principales de Upgrades 01-04 presentes y funcionales |
| **CA-08** | Tests regresión | `npm run test:run` | 48/48 tests pasan |
| **CA-09** | Validación completa | `npm run validate` | typecheck + test + build = OK |

## Evidencia prevista por criterio

Para cada CA se registrará en `docs/upgrades/05-medidor-alerta/evidencia.md`:

```
### CA-02: Correspondencia estado → nivel visual
- **Caso ejecutado**: Guardia en cada estado (PATRULLAR/INVESTIGAR/PERSEGUIR)
- **Reproducción**: 
  1. `npm run dev`
  2. Inicio → observar 33% verde
  2. Q cerca → INVESTIGAR → observar 66% amarillo
  3. Entrar en cono → PERSEGUIR → observar 100% rojo
- **Resultado observado**: [completar tras ejecución]
- **Valores configurados en código**: 33% verde (PATRULLAR), 66% amarillo (INVESTIGAR), 100% rojo (PERSEGUIR)
- **Resultados automáticos**: npm run test:run / validate [output]

### CA-03: Cambio directo sin interpolación
- **Caso ejecutado**: Transición PATRULLAR → INVESTIGAR por sonido
- **Reproducción**: 
  1. `npm run dev`
  2. Guardia patrullando, Q cerca
- **Resultado observado**: El indicador cambia directamente al nuevo valor cuando cambia guardStatus; no se observó interpolación ni animación.
- **Limitaciones**: Verificación visual, no medición frame-perfect

### CA-04: Prioridad visión sobre sonido
- **Caso ejecutado**: Visión + sonido simultáneo
- **Reproducción**: 
  1. `npm run dev`
  2. Posicionar jugador en cono de visión Y a <190px del guardia
  3. Presionar Q mismo frame
- **Resultado observado**: guardStatus PERSEGUIR y medidor en nivel alto (100% rojo); no INVESTIGAR
- **Configuración de prueba**: Jugador simultáneamente en cono de visión (visión válida) y dentro de radio 190px (sonido válido) al presionar Q.
- **Limitaciones**: Requiere timing manual

### CA-05: Reset al reiniciar
- **Caso ejecutado**: Reinicio R desde PERSEGUIR
- **Reproducción**: 
  1. `npm run dev`
  2. Llegar a PERSEGUIR (100% rojo)
  3. Presionar R
- **Resultado observado**: Barra vuelve a 33% verde (PATRULLAR inicial)

### CA-07: Upgrades 01-04 preservados
- **Comprobación**: Verificar visualmente que siguen presentes y funcionales los comportamientos principales de los Upgrades 01-04.
- **Resultado observado**: [completar tras ejecución]

### CA-08/09: Regresión y validación
- **Caso ejecutado**: Suite completa
- **Reproducción**: `npm run validate`
- **Resultado esperado**: 48 tests + typecheck + build OK
- **Resultado real observado**: [output completo]
```