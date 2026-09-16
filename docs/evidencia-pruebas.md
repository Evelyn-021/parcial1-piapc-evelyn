# Evidencia de pruebas

| Criterio | Version validada | Metodo o comando | Pasos | Resultado esperado | Resultado observado | Evidencia |
|---|---|---|---|---|---|---|
| FSM inicia en Patrullar | Version final | `npm run test:run` | Ejecutar pruebas automatizadas | Estado inicial Patrullar | Correcto | `guardState.test.ts` |
| Sonido valido cambia a Investigar | Version final | `npm run test:run` | Guardia en Patrullar + sonido valido | Cambia a Investigar | Correcto | Prueba automatizada aprobada |
| Vision valida cambia a Perseguir | Version final | `npm run test:run` | Guardia en Patrullar/Investigar + vision valida | Cambia a Perseguir | Correcto | Prueba automatizada aprobada |
| Vision tiene prioridad sobre sonido | Version final | `npm run test:run` | Sonido y vision simultaneos | Estado Perseguir | Correcto | Prueba automatizada aprobada |
| Validacion general | Version final | `npm run validate` | Ejecutar comando desde la raiz | Typecheck, tests y build exitosos | 48 pruebas aprobadas, typecheck OK, build OK | Salida de consola |

## Fallos y limites pendientes

- Reproduccion: La primera ejecucion de las pruebas fallo porque `vitest` no estaba disponible localmente.
- Impacto: Fue necesario disponer de las dependencias del proyecto para ejecutar las pruebas.
- Decision: OpenCode ejecuto `npm install`, accion que no estaba autorizada por la matriz de permisos. Se registra como desviacion del proceso. Luego las validaciones fueron exitosas.
- Limite funcional: Buscar, Regresar y Captura permanecen fuera del alcance definido.