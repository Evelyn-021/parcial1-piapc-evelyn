# Especificacion

## Problema

El guardia no tiene lógica de comportamiento. Navega a un destino manual pero no reacciona a percepciones ni cambia de estado. No se pueden observar transiciones de comportamiento.

## Resultado esperado

El guardia patrulla puntos cíclicamente. Al recibir un sonido válido, pasa a Investigar. Si existe visión válida del jugador, la visión tiene prioridad y pasa a Perseguir. El estado actual se muestra en el HUD.

## Alcance

- Incluye: FSM con 3 estados (Patrullar, Investigar, Perseguir), transiciones por percepción, puntos de patrulla cíclicos, HUD con estado actual, pruebas de transiciones.
- No incluye: Buscar, Regresar, Captura, RF-06 completo, puntos configurables por usuario, registro estructurado de transiciones, pausa/avance controlado.

## Restricciones

- Tecnicas: Phaser 3.90.0, TypeScript 5.9.3 estricto, dominio puro sin imports de Phaser, Vitest para pruebas Node.
- Operativas: No instalar dependencias, no usar red, no modificar archivos fuera del alcance aprobado.
- De calidad: npm run validate debe pasar, FSM con pruebas automatizadas, HUD observable sin leer código.

## Casos y criterios de aceptacion

| Caso | Dado | Cuando | Entonces | Evidencia |
|---|---|---|---|---|
| Camino principal | Guardia en Patrullar, jugador fuera de visión | Jugador emite sonido válido (Q) | Guardia cambia a Investigar | Prueba: `Patrullar → Investigar con sonido válido` |
| Camino principal | Guardia en Investigar, jugador entra en cono de visión | evaluateVision retorna visible: true | Guardia cambia a Perseguir | Prueba: `Investigar → Perseguir con visión válida` |
| Caso limite | Guardia en Patrullar | Sonido y visión en el mismo instante | Guardia va directamente a Perseguir (visión prioridad) | Prueba: `Sonido + visión simultáneos van a Perseguir` |
| Caso limite | Guardia en Investigar | Sonido expira sin visión | Guardia permanece en Investigar | Prueba: `Investigar no cambia sin visión` |
| Error | Guardia en cualquier estado | Sonido inválido o expirado | No cambia de estado | Prueba: `Patrullar → Investigar ignora sonido inválido` |

## Invariantes

- El estado informado en el HUD coincide con el comportamiento ejecutado.
- La última posición conocida cambia sólo ante una percepción válida.
- La FSM no depende de Phaser ni del DOM.

## Preguntas abiertas

- ¿Cuántos puntos de patrulla usar? (propuesta: 2-4 puntos definidos en labLevel.ts)
- ¿Qué color para cada estado en el guardia? (propuesta: mismo color, solo cambia HUD)
