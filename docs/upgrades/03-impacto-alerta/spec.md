# Especificación: Upgrade 03 - Impacto visual extremo de alerta

## Problema
Cuando el guardia detecta al jugador y transiciona a PERSEGUIR, el cambio de estado solo se refleja en el HUD y el cono de visión. No hay un feedback visual "extremo" que comunique la gravedad de ser detectado.

## Intención
Que el momento de detección visual se sienta intenso y claro: un impacto visual breve (camera shake + flash) que marque el instante exacto en que el guardia "ve" al jugador y comienza la persecución.

## Objetivo
Activar un feedback visual combinado (camera shake + flash rojo) **una sola vez** al transicionar a PERSEGUIR por detección visual, sin alterar lógica de percepción, FSM, ni comportamiento de navegación.

## Alcance
- **Incluye**:
  - Camera shake breve (~400ms, intensidad baja) al entrar a PERSEGUIR por visión
  - Flash rojo breve (~150ms) sincronizado con el shake
  - Disparo único por transición (usando `guardResult.transition`)
  - Aplicar en **cualquier transición a PERSEGUIR** donde `reason === "vision"`
  - Restauración automática (APIs nativas de Phaser)
- **No incluye**:
  - Partículas, shaders, sistemas de efectos complejos
  - Efectos por sonido (solo visión)
  - Efectos al salir de PERSEGUIR
  - Configuración por usuario

## Fuera de alcance
- Modificar `guardState.ts`, `perception.ts`, `memory.ts`
- Cambiar reglas de detección o prioridad visión/sonido
- Agregar dependencias
- Efectos persistentes o acumulativos

## Restricciones
- **Técnicas**: Phaser 3.90.0, TypeScript 5.9.3 strict
- **Calidad**: `npm run validate` debe pasar
- **Operativas**: Solo `GameScene.ts`, sin cambios en dominio
- **Regresión**: 48 tests existentes deben pasar

## Caso normal
**Jugador entra en cono → guardia transiciona a PERSEGUIR**
- Dado: Guardia en `patrullar` o `investigar`, jugador fuera de visión
- Cuando: Jugador se mueve dentro del cono → `evaluateVision` retorna `visible: true`
- Entonces:
  1. `computeGuardState` retorna `{ state: "perseguir", transition: { reason: "vision" } }`
  2. Se dispara `this.cameras.main.shake(400, 0.015)` + `this.cameras.main.flash(150, 255, 0, 0)`
  3. Guardia navega hacia jugador (comportamiento existente)
  4. Efectos terminan solos; cámara vuelve a posición/color normal

## Caso límite
| Caso | Descripción | Comportamiento esperado |
|---|---|---|
| **Ya en PERSEGUIR** | Jugador permanece en cono tras transición inicial | `transition === null` → **sin efecto** (no re-disparar mientras permanezca en PERSEGUIR) |
| **Nueva transición a PERSEGUIR** | La FSM actual no implementa retorno desde PERSEGUIR a PATRULLAR ni estado de captura/regreso (comportamiento preexistente, fuera de alcance). Para verificar re-disparo, se usa reinicio de escena (R). | Tras reinicio (R), nueva transición `patrullar` → `perseguir` por visión → **efecto se dispara nuevamente** una vez |
| **Sonido + visión simultáneo** | `patrullar` con Q + entrada en cono mismo frame | `reason === "vision"` → **efecto se dispara** (prioridad visión) |
| **Reinicio (R)** | `scene.restart()` durante efecto | Efecto se cancela; cámara normal al reiniciar |
| **Visión ocluida** | Jugador en rango/cono pero pared entre medio | `reason === "occluded"` → **sin transición** → **sin efecto** |

## Criterios de aceptación verificables

| ID | Criterio | Pasos de reproducción | Resultado esperado |
|---|---|---|---|
| **CA-01** | Shake al transicionar a PERSEGUIR por visión | 1. `npm run dev`<br>2. Guardia en patrullar<br>3. Mover jugador a cono<br>4. Observar cámara | Camera shake ~400ms al cambiar HUD a `estado PERSEGUIR` |
| **CA-02** | Flash rojo sincronizado | 1. `npm run dev`<br>2. Transición a PERSEGUIR por visión<br>3. Observar pantalla | Flash rojo ~150ms coincidente con inicio de shake |
| **CA-03** | Un solo disparo por transición; re-disparo en nueva transición tras reinicio | 1. `npm run dev`<br>2. Entrar en cono → PERSEGUIR (efecto 1)<br>3. Permanecer en cono > 3s → **sin repetir**<br>4. Presionar R (reiniciar escena)<br>5. Entrar en cono → PERSEGUIR (efecto 2) | Efecto se dispara en paso 2; **no se repite** en paso 3; **se dispara de nuevo** en paso 5 |
| **CA-04** | Sin efecto en transición por sonido | 1. `npm run dev`<br>2. Guardia en patrullar<br>3. Presionar Q (sonido) → INVESTIGAR<br>4. Verificar | **Sin shake/flash** (solo cambio a INVESTIGAR) |
| **CA-05** | Cámara vuelve a estado normal | 1. `npm run dev`<br>2. Provocar shake+flash<br>3. Esperar > 1s<br>4. Verificar cámara | Posición y color de cámara idénticos a antes del efecto |
| **CA-06** | Regresión: tests pasan | `npm run test:run` | 48/48 tests pasan |
| **CA-07** | Validación completa | `npm run validate` | typecheck + test + build = OK |

## Evidencia prevista por criterio

Para cada CA se registrará en `docs/upgrades/03-impacto-alerta/evidencia.md`:

```
### CA-01: Shake al transicionar a PERSEGUIR
- **Transición provocada**: patrullar → perseguir (visión)
- **Reproducción**: 
  1. `npm run dev`
  2. Guardia patrullando, jugador fuera de cono
  3. WASD mover jugador dentro del cono
- **Efecto observado**: Camera shake ~400ms al cambiar HUD a PERSEGUIR
- **Duración aproximada**: [ms observados]
- **Cámara restaurada**: [sí/no]
- **Resultado real**: [pendiente]

### CA-03: Un solo disparo por transición; re-disparo en nueva transición tras reinicio
- **Transición provocada**: Secuencia completa (entrada → permanencia → reinicio → nueva entrada)
- **Reproducción**: 
  1. `npm run dev`
  2. Entrar en cono → PERSEGUIR (registrar efecto 1)
  3. Permanecer en cono 3+ segundos (verificar **sin** efecto adicional)
  4. Presionar R (reiniciar escena)
  5. Entrar en cono → PERSEGUIR (registrar efecto 2)
- **Efecto observado**: Efecto 1 en paso 2; **ninguno** en paso 3; Efecto 2 en paso 5
- **Duración aproximada**: [ms por efecto]
- **Cámara restaurada**: [sí/no tras cada efecto]
- **Resultado real**: [pendiente]
```

**Limitación registrada**: La FSM actual no implementa retorno desde PERSEGUIR a PATRULLAR ni estado de captura/regreso; es comportamiento preexistente y queda fuera del alcance de este upgrade.