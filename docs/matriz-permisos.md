# Matriz de permisos

Completa esta matriz antes de habilitar acciones de un agente. Una accion no declarada debe considerarse prohibida hasta consultar.

| Accion | Estado | Alcance o justificacion |
|---|---|---|
| Leer archivos del proyecto | Permitida | Todo el repositorio |
| Buscar rutas y simbolos | Permitida | Todo el repositorio |
| Editar archivos previstos | Permitida | Solo los archivos definidos en docs/plan.md |
| Ejecutar scripts documentados | Permitida | Solo scripts documentados en package.json para validación |
| Ejecutar scripts documentados | Pendiente | Solo comandos documentados o autorizados |
| Instalar dependencias | Prohibida | Fuera de alcance |
| Usar red | Prohibida | Fuera de alcance |
| Publicar o subir cambios | Prohibida | Fuera de alcance |
| Acceder a secretos o credenciales | Prohibida | Prohibido |

## Condiciones de detencion

## Condiciones de detencion

- Detener la herramienta si propone modificar archivos fuera del alcance definido.
- Detener la herramienta si necesita instalar dependencias o usar red.
- Detener la herramienta si requiere acceso a secretos, credenciales o datos privados.
- Detener la herramienta si propone ejecutar comandos no documentados ni autorizados.
- Detener la herramienta si aparece una decision de disenio no definida por la consigna.
- Detener la herramienta si una validacion falla y no se comprende la causa.
- Detener la herramienta si aparecen cambios ajenos al alcance del parcial.