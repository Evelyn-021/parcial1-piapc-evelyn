# Plan de intervencion

## Objetivo del plan

Implementar una FSM con 3 estados (Patrullar, Investigar, Perseguir) que use la percepción existente como entrada, con transiciones observables en el HUD. El dominio de la FSM debe ser puro (sin Phaser) y tener pruebas automatizadas.

## Cambios propuestos

| Paso | Cambio minimo | Archivos previstos | Verificacion | Riesgo | Condicion de detencion |
|---:|---|---|---|---|---|
| 1 | Crear FSM como dominio puro con 3 estados y transiciones | `src/domain/guard/guardState.ts` (nuevo) | Pruebas pasan, sin imports de Phaser | Acoplamiento a Phaser | Si requiere imports de Phaser → detener |
| 2 | Crear pruebas de transiciones de la FSM | `tests/guard/guardState.test.ts` (nuevo) | 7 pruebas pasan | Ninguno | Si alguna prueba no es independiente de Phaser → detener |
| 3 | Agregar puntos de patrulla a labLevel.ts | `src/application/simulation/labLevel.ts` | Constante PATROL_POINTS walkable | Puntos bloqueados | Si algún punto no es walkable → detener |
| 4 | Integrar FSM en GameScene y actualizar HUD | `src/game/scenes/GameScene.ts` | HUD muestra estado actual, guardia cambia de estado | Acoplamiento en GameScene | Si la integración requiere más de 50 líneas nuevas → detener |
| 5 | Ejecutar npm run validate | Comando | typecheck + test + build pasan | Regresión | Si falla después de 2 intentos → detener |

## Orden de implementacion

1. **FSM (paso 1-2):** Primero se crea y se prueba el dominio puro. Si la FSM no funciona en pruebas aisladas, no tiene sentido integrarla.
2. **Patrulla (paso 3):** Se agregan puntos de patrulla verificados como walkable. Son dependencia de la FSM.
3. **Integración (paso 4):** Se conecta FSM con percepción existente y se actualiza HUD. Solo después de que FSM y patrulla funcionen.
4. **Validación (paso 5):** Se verifica que todo junto pasa `npm run validate`.

## Fuera de alcance

- Buscar y Regresar (RF-06 parcial)
- Captura del jugador
- Puntos de patrulla configurables por usuario
- Registro estructurado de transiciones
- Pausa y avance controlado
- Behavior trees, Utility AI o GOAP
