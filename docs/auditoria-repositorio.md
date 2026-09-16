# Auditoria del repositorio

## Objetivo

Registrar hechos verificables sobre la estructura, arquitectura y validacion del proyecto antes de proponer cambios.

## Rutas y simbolos relevantes

| Ruta o simbolo | Rol observado | Evidencia |
|---|---|---|
| `src/domain/perception/perception.ts` | evaluateVision, evaluateSound | Funciones puras de percepción视觉 y sonora |
| `src/domain/perception/memory.ts` | PerceptionMemory, rememberObservation | Memoria de última posición conocida |
| `src/domain/navigation/search.ts` | findPathAStar, findPathBfs | Navegación con A* y BFS |
| `src/domain/navigation/pathFollower.ts` | advanceAlongPath | Seguimiento de waypoints |
| `src/domain/model/grid.ts` | GridMap, isWalkable, cellCenter | Modelo de cuadrícula lógica |
| `src/domain/model/vector.ts` | Vector2, distanceBetween | Operaciones vectoriales |
| `src/application/simulation/perceptionSimulation.ts` | updatePerceptionSimulation | Integración percepción + memoria |
| `src/application/simulation/labLevel.ts` | LAB_MAP, PLAYER_START, GUARD_START | Configuración del nivel |
| `src/game/scenes/GameScene.ts` | GameScene | Escena principal (351 líneas) |
| `package.json` | Phaser 3.90.0, Vitest 4.1.10 | Dependencias y scripts |
| `specs/01-producto.md` | Especificación del producto | 5 estados, RF-01 a RF-09 |
| `specs/02-pedagogica.md` | Especificación pedagógica | RA7: implementar A* y FSM |

## Flujo observado

1. Jugador se mueve con WASD/flechas (RF-01 ✅)
2. Jugador emite sonido con Q → `withSoundEvent` actualiza estado
3. `updatePerceptionSimulation` evalúa visión y sonido cada frame
4. Jugador hace click → `calculateRoute` calcula ruta con A*
5. `advanceAlongPath` mueve al guardia a lo largo de la ruta
6. HUD muestra métricas de navegación, visión y sonido
7. **No hay FSM ni estados del guardia** — el guardia solo sigue waypoints

## Pruebas y comandos disponibles

| Comando o prueba | Que verifica | Resultado inicial |
|---|---|---|
| `npm run test:run` | Todas las pruebas Vitest | 6 archivos, ~30 pruebas |
| `npm run typecheck` | TypeScript estricto | Sin errores |
| `npm run build` | Compilación Vite | Sin errores |
| `npm run validate` | typecheck + test + build | Pasando |
| `tests/perception/perception.test.ts` | evaluateVision, evaluateSound | 8 pruebas de visión, 3 de sonido |
| `tests/perception/memory.test.ts` | rememberObservation, timeSinceLastPerception | 5 pruebas de memoria |
| `tests/navigation/search.test.ts` | findPathAStar, findPathBfs | 8 pruebas de navegación |
| `tests/navigation/pathFollower.test.ts` | advanceAlongPath | 6 pruebas de seguimiento |
| `tests/model/grid.test.ts` | isWalkable, cellCenter, worldToCell | 5 pruebas de grid |
| `tests/application/perceptionSimulation.test.ts` | updatePerceptionSimulation | 2 pruebas de integración |

## Hechos, supuestos y preguntas abiertas

- Hechos comprobados: El dominio de percepción, navegación y memoria funciona y tiene pruebas. La FSM no existe. El guardia no tiene lógica de estados.
- Supuestos por verificar: Los puntos de patrulla se pueden definir como array estático en labLevel.ts. La FSM puede implementarse como módulo de dominio puro.
- Preguntas para consultar: ¿Cuántos puntos de patrulla usar? ¿Qué color/icono para cada estado en el HUD?
