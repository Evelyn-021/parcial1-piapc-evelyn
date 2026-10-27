# GDD - TP Final Integrador: IA para NPC en Videojuego

## Juego y experiencia

- **Género y situación de juego**: Sigilo 2D cenital. El jugador navega un laberinto generable con el objetivo de alcanzar la salida sin ser atrapado por un guardia IA.
- **Rol del jugador**: Moverse por el escenario, emitir sonidos como distracción y alcanzar la salida. El jugador debe evitar la visión del guardia.
- **Experiencia buscada**: Observar cómo el guardia adapta su comportamiento de patrullaje a escenarios variables y cómo el jugador usa el entorno para evadir la IA.

## Entidades

- **Jugador**: Se mueve con WASD, puede emitir sonido (Q) y alcanzar la salida.
- **Guardia**: NPC con IA de sigilo que patrulla, investiga y persigue.

## Estados y comportamiento del guardia

Los tres estados del FSM (Finite State Machine):

1. **Patrullar** (inicial): El guardia se mueve cíclicamente entre puntos de patrulla. Al cambiar de escenario, las rutas se recalculan considerando obstáculos.
2. **Investigar**: Se activa al escuchar un sonido desde una posición conocida. El guardia se dirige al último lugar donde se oyó el sonido y vuelve a patrullar si no encuentra al jugador.
3. **Perseguir**: Se activa al ver al jugador dentro del cono de visión y rango. El guardia sigue al jugador hasta que este sale de vista.

**Reglas de transición** (validadas contra `src/domain/guard/guardState.ts`):

- La visión tiene prioridad sobre el sonido. Simultáneo → **Perseguir**.
- **Perseguir** → **Investigar** si el jugador sale de la visión pero se tiene posición última conocida por sonido.
- **Investigar** → **Patrullar** si el tiempo de investigación expira sin hallar al jugador.
- **Patrullar** → **Investigar** si detecta sonido nuevo.
- **Patrullar** → **Perseguir** si el jugador entra directamente a la visión (caso borde).

No se describen transiciones que no implmente el código actual.

## Algoritmos de búsqueda y navegación

### Algoritmos de búsqueda (seleccionables)

- **A\***: Encuentra rutas optimizando costos por celda. Compatible con costos ponderados.
- **BFS**: Encuentra la ruta más corta en cantidad de pasos (saltos unitarios). No soporta costos variables.

### Modos de navegación (seleccionables)

- **Ruta directa**: Prioriza el camino más corto en pasos. Al seleccionar BFS, el modo se activa automáticamente con costos unitarios.
- **Ruta segura**: Evita zonas de riesgo mediante costos ponderados en celdas transitables. Al seleccionar este modo, el sistema **activa A* obligatoriamente** para aplicar los costos de evitación. Si se selecciona BFS, el sistema cambia automáticamente al modo **ruta directa** (costos unitarios) para evitar comportamientos incompatibles.

**Zonas de riesgo**: Celdas transitables con costo de recorrido mayor (configurable). El modo seguro asigna costos más altos a estas zonas, haciendo que el guardia prefiera evitarlas cuando es posible sin sacrificar viabilidad.

### Combinación automática simplificada

| Modo seguro | Algoritmo |
|-------------|-----------|
| Modo seguro seleccionado | A* (costos ponderados) |
| BFS seleccionado | Modo directo (costos unitarios) |

El sistema garantiza que nunca se use BFS con costos ponderados; si el usuario selecciona BFS, se activa el modo directo automáticamente.

## Generación y validación de escenarios

- Escenarios variables generados aleatoriamente con obstáculos y caminos transitables.
- Validación automática antes de usarse:

  1. **Conectividad inicio-salida**: Camino viable desde la posición inicial hasta la salida (modo BFS por defecto).
  2. **Conectividad de patrulla**: Waypoints mutuamente alcanzables considerando obstáculos.
  3. **Sin superposición con paredes**: Jugador, guardia y salida no generan dentro de celdas de pared.
  4. **Patrulla transitable**: Todos los waypoints tienen al menos un camino BFS entre ellos.
  5. **Caminos alcanzables**: Desde la posición inicial, se puede alcanzar la salida sin atravesar paredes.

- Si la configuración no pasa la validación, el generador regenera el mapa o ajusta elementos hasta cumplir todos los criterios.

## Controles de selección (interfaz sencilla)

- **Tecla A**: Alternar algoritmo A* / BFS.
- **Tecla N**: Alternar modo ruta directa / ruta segura.
- **Tecla G**: Generar nuevo escenario (revalida conectividad).
- **Tecla R**: Reiniciar partida con configuraciones actuales.

## Rutas de patrullaje adaptativas

Los puntos de patrulla **se recalculan completamente** cuando cambia el escenario. No se utilizan trayectorias fijas que ignoren obstáculos:

- Al generar un nuevo escenario, los waypoints se reposicionan para ser mutuamente alcanzables.
- El modo seguro puede afectar la selección de waypoints para evitarlos zonas de riesgo cuando la distribución del mapa lo permita.

## Límites técnicos

- Motor: Phaser 3.90.0, TypeScript 5.9.3 estricto.
- Lógica pura sin dependencia de Phaser (FSM, percepción, navegación en dominio puro).
- Vitest para pruebas unitarias e integración.
- Validación: `npm run validate` debe pasar (typecheck + test + build).

## Criterios de aceptación

- El FSM del guardia tiene 3 estados verificables con transiciones consistentes contra `guardState.ts`.
- Se pueden seleccionar A* o BFS como algoritmo de búsqueda.
- Se pueden seleccionar modo "ruta directa" o "ruta segura" como alternativa de navegación.
- Si se selecciona modo seguro, el sistema usa A* con costos ponderados; si se selecciona BFS, se activa modo directo automáticamente.
- Los escenarios generados pasan validación de conectividad (inicio-salida, patrulla, sin superposición con paredes).
- Las rutas de patrulla se recalculan al cambiar de escenario.
- El jugador puede ganar alcanzando la salida sin ser atrapado.
- `npm run validate` pasa completiendo.