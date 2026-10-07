# Especificación: Upgrade 02 - Patrulla con pausas y mirada direccional

## Problema
El guardia patrulla de forma mecánica e ininterrumpida: al llegar a un punto de patrulla, inmediatamente recalcula y parte hacia el siguiente. No hay pausas naturales ni coherencia visual en la dirección de la mirada entre segmentos.

## Intención
Que el guardia se sienta menos robótico: se detiene brevemente en cada punto de patrulla, orienta su mirada hacia el siguiente destino durante la pausa, y luego reanuda el recorrido.

## Objetivo
Agregar pausas breves y deterministas en los puntos de patrulla con mirada direccional coherente, reutilizando la navegación, FSM y percepción existentes sin modificarlas.

## Alcance
- **Incluye**:
  - Pausa breve (~1500 ms) al completar cada segmento en estado `patrullar`
  - Durante la pausa: `guardFacing` orientado hacia el siguiente punto de patrulla
  - Reanudación automática de la patrulla tras la pausa
  - Percepción y FSM siguen activos durante la pausa
- **No incluye**:
  - FSM nueva o estados adicionales
  - Puntos de patrulla configurables
  - Pausas variables por punto
  - Animaciones de "esperar" (sprites, tweens)
  - Timer como concepto arquitectónico fijado (se define en plan)

## Fuera de alcance
- Modificar `advanceAlongPath`, `calculateRoute`, `pathFollower`, `search`
- Modificar `guardState.ts`, `perception.ts`, `memory.ts`
- Agregar dependencias
- Cambiar velocidad de patrulla o pathfinding
- Mecanismo de timer específico (se define en plan)

## Restricciones
- **Técnicas**: Phaser 3.90.0, TypeScript 5.9.3 strict, dominio puro sin Phaser
- **Calidad**: `npm run validate` debe pasar (typecheck + test + build)
- **Operativas**: Solo modificar `GameScene.ts` (lógica de pausa + facing)
- **Regresión**: 48 tests existentes deben seguir pasando
- **Arquitectura**: Sin FSM nueva, sin cambios a pathfinding, sin cambios a advanceAlongPath

## Requisitos observables
1. El guardia pausa aproximadamente 1500 ms al completar un punto de patrulla
2. Durante la pausa orienta la mirada hacia el siguiente punto
3. Después reanuda la patrulla normalmente
4. Percepción y FSM siguen funcionando durante la pausa

## Caso normal
**Guardia patrulla y pausa en punto**
- Dado: Guardia en estado `patrullar`, moviéndose hacia punto P1
- Cuando: `advanceAlongPath` retorna `completed: true`
- Entonces:
  1. Inicia pausa (~1500ms)
  2. `guardFacing` apunta al centro del siguiente punto P2
  3. Guardia permanece quieto (no avanza)
  4. Percepción y HUD siguen actualizándose
  5. Al expirar pausa: recalcula ruta y continúa patrulla

## Caso límite
| Caso | Descripción | Comportamiento esperado |
|---|---|---|
| **Visión durante pausa** | Jugador entra en cono mientras guardia pausa | FSM transiciona a `perseguir`; la pausa de patrulla no impide la conducta de persecución ya existente |
| **Sonido durante pausa** | Jugador emite Q (sonido válido) | FSM transiciona a `investigar`; la pausa de patrulla no impide la conducta de investigación ya existente |
| **Reinicio (R)** | `scene.restart()` durante pausa | Timer y estado de pausa se resetean; patrulla inicia desde punto 0 |
| **Pausa en último punto** | Completado P4 (último de array) | Apunta a P0 (cíclico); pausa normal; continúa a P0 |
| **Pausa solo en patrullar** | Guardia en `investigar` o `perseguir` completa camino | No hay pausa; comportamiento existente se conserva |

## Criterios de aceptación verificables

| ID | Criterio | Pasos de reproducción | Resultado esperado |
|---|---|---|---|
| **CA-01** | Pausa al completar segmento en patrullar | 1. `npm run dev`<br>2. Observar guardia llegar a punto de patrulla<br>3. Verificar tiempo quieto | Guardia se detiene ~1500ms en cada punto |
| **CA-02** | Mirada hacia siguiente punto durante pausa | 1. `npm run dev`<br>2. Guardia en pausa en P1<br>3. Observar cono (gráfico + HUD `vision`) | Cono apunta hacia P2 (siguiente punto) |
| **CA-03** | Reanudación automática tras pausa | 1. `npm run dev`<br>2. Esperar fin de pausa<br>3. Observar movimiento | Guardia recalcula ruta y parte hacia siguiente punto |
| **CA-04** | Visión interrumpe pausa → persecución | 1. `npm run dev`<br>2. Guardia en pausa<br>3. Mover jugador a cono<br>4. Ver HUD `estado PERSEGUIR` | FSM transiciona a `perseguir`; guardia persigue jugador (conducta existente) |
| **CA-05** | Sonido interrumpe pausa → investigación | 1. `npm run dev`<br>2. Guardia en pausa<br>3. Jugador presiona Q cerca<br>4. Ver HUD `estado INVESTIGAR` | FSM transiciona a `investigar`; guardia investiga sonido (conducta existente) |
| **CA-06** | Sin pausa en investigar/perseguir | 1. `npm run dev`<br>2. Provocar `investigar` (Q) o `perseguir` (entrar en cono)<br>3. Ver completar camino | No hay pausa; comportamiento existente |
| **CA-07** | Regresión: tests pasan | `npm run test:run` | 48/48 tests pasan |
| **CA-08** | Validación completa | `npm run validate` | typecheck + test + build = OK |

## Evidencia prevista por criterio

Para cada CA se registrará en `docs/upgrades/02-patrulla-pausas-mirada/evidencia.md`:

```
### CA-01: Pausa al completar segmento
- **Caso ejecutado**: Guardia llega a punto de patrulla en estado patrullar
- **Reproducción**: 
  1. `npm run dev`
  2. Observar guardia (no mover jugador)
  3. Verificar pausa en cada punto
- **Resultado esperado**: ~1500ms quieto por punto
- **Resultado real observado**: [pendiente - completar tras ejecución]
- **Limitaciones**: Medición visual, no frame-perfect

### CA-02: Mirada hacia siguiente punto
- **Caso ejecutado**: Guardia en pausa en punto P1
- **Reproducción**:
  1. `npm run dev`
  2. Identificar punto actual y siguiente
  3. Verificar orientación del cono
- **Resultado esperado**: Cono orientado al centro de siguiente punto
- **Resultado real observado**: [pendiente]
- **Limitaciones**: Verificación visual del cono

### CA-04: Visión interrumpe pausa
- **Caso ejecutado**: Jugador entra en cono durante pausa
- **Reproducción**:
  1. `npm run dev`
  2. Esperar guardia en pausa
  3. Mover jugador (WASD) dentro del cono
- **Resultado esperado**: HUD `estado PERSEGUIR`, guardia se mueve hacia jugador
- **Resultado real observado**: [pendiente]
- **Limitaciones**: Requiere timing manual

### CA-05: Sonido interrumpe pausa
- **Caso ejecutado**: Jugador emite sonido durante pausa
- **Reproducción**:
  1. `npm run dev`
  2. Guardia en pausa
  3. Presionar Q cerca del guardia
- **Resultado esperado**: HUD `estado INVESTIGAR`, guardia va hacia sonido
- **Resultado real observado**: [pendiente]
- **Limitaciones**: Requiere timing manual
```

---

**¿Aprobás esta spec corregida para proceder con el plan?**