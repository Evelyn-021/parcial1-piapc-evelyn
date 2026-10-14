# Evidencia — práctica de navegación
Repositorio: https://github.com/Evelyn-021/parcial1-piapc-evelyn.git
Commit inicial: 235955674a22c2d3eaacb2e4df6899de7dc41d7a
Commit de implementación: [PENDIENTE - se informará en la entrega]
Versión de entrega: commit final informado por el estudiante en la plataforma.
Variante: A
Herramienta/modelo o trabajo manual: opencode / nemotron-3-ultra-free
Cambios previos: Parcial 1 completado — FSM guardia (Patrullar/Investigar/Perseguir), percepción visión/sonido, navegación BFS/A* unitarios, pathFollower, HUD, 30+ tests pasando, npm run validate OK.
Línea base: npm run validate → typecheck OK (0 errores), 48 tests OK (7 archivos), build OK (5.38s). Warning preexistente: chunk >500kB. Sin fallos previos. Ver salida completa abajo.

## Exploración mínima
| Capa | Ruta/símbolo | Capacidad comprobada |
|---|---|---|
| Búsqueda | src/domain/navigation/search.ts: findPathBfs, findPathAStar | BFS y A* unitarios (costo=1), heurística Manhattan, 4 dir. cardinales, GridPoint[] path, totalCost=path.length-1, expandedNodes, maximumFrontier, explored |
| Seguimiento | src/domain/navigation/pathFollower.ts: advanceAlongPath | Avanza waypoints Vector2[] con distancia máxima, devuelve posición, nextWaypoint, completed, direction |
| Consumidor | src/application/simulation/navigationDemo.ts: calculateRoute | Selector BFS/A* por string, pasa GridMap, start, goal; sin costes variables |
| Pruebas | tests/navigation/search.test.ts, tests/navigation/pathFollower.test.ts | 8 tests nav (BFS/A* óptimo, start=goal, endpoints inválidos, inaccesible, comparación), 6 tests pathFollower |

Contraste y decisión humana: El código actual usa coste uniforme 1 en A* (search.ts:101). La variante A requiere costes de entrada variables; BFS debe permanecer unitario. **DECISIÓN APROBADA POR EL ESTUDIANTE**: extender GridMap con cellCosts opcional (default 1), modificar walkableNeighbors para devolver coste, adaptar A* para sumar costes de entrada (excluyendo start, incluyendo goal), BFS desestructura solo .point. Aprobada expresamente.
Spec/plan aprobados: 14/10/2026 - spec.md y plan.md marcados como Aprobados. Decisión técnica registrada arriba.

## Comparación común — fixture libre 5x3
Vecinos y desempate reales: 4 direcciones cardinales (N,E,S,O) en orden fijo: N(0,-1), E(1,0), S(0,1), O(-1,0). Desempate A*: menor f = g+h, luego menor h, luego menor order de inserción.

| Algoritmo | Estado | Ruta | Pasos | Costo | Expandidos | Frontera máxima |
|---|---|---|---:|---:|---:|---:|
| BFS | success | (0,1)→(1,1)→(2,1)→(3,1)→(4,1) | 4 | 4 | 12 | 4 |
| A* | success | (0,1)→(1,1)→(2,1)→(3,1)→(4,1) | 4 | 4 | 5 | 9 |

DFS: Grafo S:[A,B], A:[C], C:[X], X:[G], B:[D,E], D:[G], E:[], G:[]. Ruta DFS: S-A-C-X-G (4 pasos). BFS encuentra S-B-D-G (3 pasos). DFS no garantiza optimalidad en pasos.
Dijkstra: S→A=1, A→G=9, S→B=3, B→G=3. Primero descubre G con costo 10 (vía A) y después lo mejora a 6 (vía B). Ruta óptima: S-B-G, costo 6. Conclusión: Dijkstra/A* ponderado minimiza costo, no pasos.

## Criterio → evidencia
| Criterio | Prueba/archivo y comando o reproducción | Observado | Cumple/pendiente |
|---|---|---|---|
| BASE-AC1 | auditoria-repositorio.md, git log --oneline -1, npm run validate | Repositorio identificado (https://github.com/Evelyn-021/parcial1-piapc-evelyn.git), commit 235955674a22c2d3eaacb2e4df6899de7dc41d7a, capas documentadas, validación base OK | Cumple |
| BASE-AC2 | tests/navigation/search.test.ts: "common fixture 5x3" describe block, `npm run test:run -- tests/navigation/search.test.ts` | BFS: success, 4 pasos, costo 4, expandidos=12, frontera max=4. A*: success, 4 pasos, costo 4, expandidos=5, frontera max=9. Ambos hallan ruta cardinal válida. | Cumple |
| BASE-AC3 | tests/navigation/search.test.ts: start=goal (costo 0), barrera completa (unreachable), extremos inválidos (invalid-start/goal) | start=goal: BFS y A* success, costo 0, expandedNodes=1. Barrera x=2: ambos unreachable, path=[], totalCost=null. Extremos (-1,1) y (5,1): ambos invalid-start/invalid-goal, expandedNodes=0. | Cumple |
| BASE-AC4 | spec.md, plan.md, decisión humana registrada | Spec y plan Aprobados, decisión documentada y aprobada por estudiante | Cumple |
| A-AC1 | tests/navigation/search.test.ts: "variant A: terreno lento" A* weighted finds cheaper detour, `npm run test:run -- tests/navigation/search.test.ts` | A*: success, 6 pasos, costo 6, evita fila lenta (y=0 o y=2). Ruta directa costo 16 verificado. | Cumple |
| A-AC2 | tests/navigation/search.test.ts: "variant A: terreno lento" A* with uniform costs restores direct path, `npm run test:run -- tests/navigation/search.test.ts` | A*: success, 4 pasos, costo 4, ruta directa por (1,1),(2,1),(3,1). | Cumple |
| A-AC3 | tests/navigation/search.test.ts: "calculateRoute integration" A* y BFS via calculateRoute, `npm run test:run -- tests/navigation/search.test.ts` | A*: success, 6 pasos costo 6 (terreno lento) y 4 pasos costo 4 (uniforme). BFS: success, 4 pasos costo 4, ignora costes. Contrato existente funciona sin cambios. | Cumple |
| BASE-AC5 | npm run validate, git diff | Validación final OK (typecheck + 76 tests + build). Diff revisado: 5 archivos fuente + tests, sin regresiones, solo variante A. | Cumple |
| BASE-AC6 | URL, commit final, tres documentos en docs/practica-navegacion/ | spec.md, plan.md, evidencia.md completos en docs/practica-navegacion/. Commit final pendiente de registro por estudiante en plataforma. | Pendiente (entrega) |

## Registro mínimo de intervención
Prompts: Exploración de repositorio, BASE-01 a BASE-04 completados con fixture 5x3, spec/plan aprobados, Incremento 1 implementado (dominio + costos variables), Incremento 2 implementado (pruebas integración calculateRoute), Incremento 3 ejecutado (validación final + diff + cierre evidencia).
Decisión tras incremento 1: **ACEPTAR** - A* ponderado halla rodeo de 6 pasos costo 6 vs directo 4 pasos costo 16; BFS invariante (4 pasos costo 4); costos uniformes restauran ruta directa 4 pasos costo 4. Todos los tests pasan (73 totales), validación completa OK.
Decisión tras incremento 2: **ACEPTAR** - calculateRoute (consumidor existente) funciona sin modificaciones: A* vía calculateRoute devuelve costo 6 con terreno lento y costo 4 con costos uniformes; BFS vía calculateRoute mantiene comportamiento unitario (costo 4). 76 tests totales, validación completa OK.
Decisión tras incremento 3: **ACEPTAR** (aprobado por estudiante) - Validación final exitosa (typecheck + 76 tests + build). Diff confirma alcance mínimo: solo 5 archivos modificados (grid.ts, gridGraph.ts, search.ts, grid.test.ts, search.test.ts). Sin cambios a FSM, percepción, GameScene, pathFollower, dependencias ni navigationDemo.ts.
Validación final: `npm run validate` → typecheck OK (0 errores), 76 tests OK (7 archivos), build OK (5.27s). Warning preexistente chunk >500kB (no nuevo).
Diff revisado: 5 archivos fuente/tests modificados, 354 inserciones, 11 eliminaciones. Solo variante A implementada.
Conclusión: A* ponderado es la navegación adecuada para este escenario porque minimiza el costo real de desplazamiento (evita terreno costoso) manteniendo la heurística Manhattan admisible (costo mínimo 1). BFS se conserva para casos unitarios donde el número de pasos es la métrica relevante. El consumidor calculateRoute opera sin cambios gracias a la extensión backward-compatible de GridMap.
Limitaciones: (1) Warning preexistente de chunk >500kB en build Vite (no introducido por esta práctica). (2) Sin diagonales — solo 4 direcciones cardinales. (3) Costos estáticos por celda (no dinámicos en runtime). (4) Heurística Manhattan admisible solo porque costos ≥ 1. (5) Commit final y URL de entrega pendientes de registrar por el estudiante.

---

## Salida completa npm run validate (línea base)

```
> piapc-guardia-sigilo@0.1.0 validate
> npm run typecheck && npm run test:run && npm run build

> piapc-guardia-sigilo@0.1.0 typecheck
> tsc --noEmit

> piapc-guardia-sigilo@0.1.0 test:run
> vitest run


 RUN  v4.1.10 C:/Users/USER/Documents/UNIVERSIDAD/PIAPC/Parcial1

 Test Files  7 passed (7)
      Tests  48 passed (48)
   Start at  15:01:40
   Duration  890ms (transform 652ms, setup 0ms, import 1.15s, tests 48ms, environment 1ms)

> piapc-guardia-sigilo@0.1.0 build
> tsc --noEmit && vite build

vite v6.4.3 building for production...
transforming...
OK 21 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  1.23 kB | gzip:   0.59 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
dist/assets/index-BdusbQAW.css   1.53 kB | gzip:   0.80 kB
dist/assets/index-5M2L7nlI.js    1,501.15 kB | gzip: 346.42 kB
OK built in 5.38s
```

---

## Salida npm run validate (Incremento 1 + 2)

```
> piapc-guardia-sigilo@0.1.0 validate
> npm run typecheck && npm run test:run && npm run build

> piapc-guardia-sigilo@0.1.0 typecheck
> tsc --noEmit

> piapc-guardia-sigilo@0.1.0 test:run
> vitest run


 RUN  v4.1.10 C:/Users/USER/Documents/UNIVERSIDAD/PIAPC/Parcial1

 Test Files  7 passed (7)
      Tests  76 passed (76)
   Start at  16:00:04
   Duration  447ms (transform 481ms, setup 0ms, import 877ms, tests 58ms, environment 1ms)

> piapc-guardia-sigilo@0.1.0 build
> tsc --noEmit && vite build

vite v6.4.3 building for production...
transforming...
OK 21 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  1.23 kB | gzip:   0.59 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
dist/assets/index-BdusbQAW.css   1.53 kB | gzip:   0.80 kB
dist/assets/index-CEHpnSlO.js    1,501.43 kB | gzip: 346.52 kB
OK built in 5.38s
```

---

## Salida npm run validate (Incremento 3 - Final)

```
> piapc-guardia-sigilo@0.1.0 validate
> npm run typecheck && npm run test:run && npm run build

> piapc-guardia-sigilo@0.1.0 typecheck
> tsc --noEmit

> piapc-guardia-sigilo@0.1.0 test:run
> vitest run


 RUN  v4.1.10 C:/Users/USER/Documents/UNIVERSIDAD/PIAPC/Parcial1

 Test Files  7 passed (7)
      Tests  76 passed (76)
   Start at  16:07:43
   Duration  493ms (transform 546ms, setup 0ms, import 994ms, tests 71ms, environment 1ms)

> piapc-guardia-sigilo@0.1.0 build
> tsc --noEmit && vite build

vite v6.4.3 building for production...
transforming...
OK 21 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  1.23 kB | gzip:   0.59 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
dist/assets/index-BdusbQAW.css   1.53 kB | gzip:   0.80 kB
dist/assets/index-CEHpnSlO.js    1,501.43 kB | gzip: 346.52 kB
OK built in 5.27s
```