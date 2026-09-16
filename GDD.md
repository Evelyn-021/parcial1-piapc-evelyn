# GDD simplificado

## Juego y experiencia

- Genero y situacion de juego: Sigilo 2D cenital. Un jugador se mueve por un laberinto y un guardia reacciona a percepciones.
- Rol del jugador: Provocar y comprender transiciones de comportamiento del guardia.
- Experiencia buscada: Observar cómo el guardia cambia de estado ante sonido y visión.

## Comportamiento a resolver

- Entidad: Guardia
- Problema actual: El guardia navega a un destino manual sin lógica de comportamiento ni reacción a percepción. No hay estados ni transiciones observables.
- Comportamiento esperado: El guardia patrulla puntos cíclicamente, reacciona a sonido investigando, reacciona a visión persiguiendo, y el estado actual se muestra en pantalla.

## Reglas

- Estados, condiciones o eventos relevantes: Patrullar (inicial), Investigar (sonido válido), Perseguir (visión válida). La visión tiene prioridad sobre el sonido.
- Accion del jugador o del entorno: Emitir sonido con Q para provocar Investigar. Moverse para entrar o salir del cono de visión.
- Resultado esperado: Transiciones observables en el HUD. El guardia cambia de patrullar a investigar al oír, y de investigar a perseguir al ver.
- Caso limite: Sonido y visión en el mismo instante. Visión tiene prioridad → va directamente a Perseguir.

## Limites

- Fuera de alcance: Buscar, Regresar, Captura, RF-06 completo, puntos de patrulla configurables por usuario, registro estructurado de transiciones.
- Restricciones tecnicas: Phaser 3.90.0, TypeScript 5.9.3 estricto, dominio puro sin dependencia de Phaser, Vitest para pruebas.
- Criterios de aceptacion: npm run validate pasa, FSM con pruebas, HUD muestra estado actual, transiciones verificables.

El GDD delimita la intencion de diseno. La especificacion y el plan convierten esa intencion en una intervencion tecnica verificable.
