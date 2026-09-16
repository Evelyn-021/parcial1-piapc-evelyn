# Informe final

## Resultado

Se implemento una FSM de dominio para el guardia con los estados Patrullar, Investigar y Perseguir. El guardia comienza patrullando, investiga ante un sonido valido y persigue ante vision valida. Cuando sonido y vision ocurren simultaneamente, la vision tiene prioridad. El estado actual se muestra en el HUD.

## Cambios y decisiones

- Cambios realizados: FSM de dominio puro, pruebas automatizadas, puntos de patrulla ciclicos e integracion de estados en GameScene y HUD.
- Decisiones humanas relevantes: Se limito la intervencion a Patrullar, Investigar y Perseguir. Buscar, Regresar y Captura quedaron fuera de alcance.
- Acciones del agente aceptadas, rechazadas o corregidas: Se corrigio la propuesta inicial del agente que interpretaba tres estados como requisito minimo. Tambien se registra que el agente ejecuto `npm install` durante la validacion aunque la instalacion de dependencias estaba declarada como prohibida.

## Validacion

- Camino principal: Guardia en Patrullar + sonido valido -> Investigar. Prueba automatizada aprobada.
- Caso limite: Sonido y vision simultaneos -> Perseguir. Prueba automatizada aprobada.
- Validacion general: `npm run validate` completo correctamente: typecheck OK, 48 pruebas aprobadas y build OK.
- Version validada: commit final de entrega.

## Limites y riesgos pendientes

- Buscar y Regresar no fueron implementados porque quedaron fuera del alcance de esta intervencion.
- Captura del jugador permanece fuera de alcance.
- La ejecucion no autorizada de `npm install` queda registrada como desviacion del proceso.