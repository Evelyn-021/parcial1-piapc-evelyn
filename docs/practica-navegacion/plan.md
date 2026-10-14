# Plan — práctica de navegación
Estado: Aprobado
Variante: A
Spec: spec.md

| Incremento | Trabajo | Archivos reales | Criterios | Comprobación |
|---|---|---|---|---|
| 1 | Configurar/ajustar dominio y probar caso normal/límite de mi variante | src/domain/model/grid.ts, src/domain/navigation/gridGraph.ts, src/domain/navigation/search.ts, tests/navigation/search.test.ts, tests/model/grid.test.ts | A-AC1, A-AC2, BASE-AC2, BASE-AC3 | npm run test:run -- tests/navigation/search.test.ts tests/model/grid.test.ts |
| 2 | Conectar con consumidor existente y probar contrato anterior | src/application/simulation/navigationDemo.ts, tests/navigation/search.test.ts | A-AC3, BASE-AC5 | npm run test:run -- tests/navigation/search.test.ts |
| 3 | Validación final, diff y cierre de evidencia | [archivos modificados en incrementos 1 y 2] | BASE-AC1 a BASE-AC6 | npm run validate |

Referencia previa: comparación y casos comunes BASE-01 a BASE-04 completados con evidencia en evidencia.md.
Riesgos: (1) Cambio en firma de walkableNeighbors rompe BFS si no se adapta correctamente; (2) totalCost en A* cambia de pasos a coste real — tests existentes pueden fallar si esperan path.length-1.
Detenerse si: faltan permisos, hay cambios ajenos, conflicto de contrato, regresión nueva o se requiere dependencia/UI/refactorización fuera del alcance.
No crear commits ni publicar automáticamente.