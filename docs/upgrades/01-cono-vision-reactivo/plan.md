# Plan de implementación: Upgrade 01 - Cono de visión visible y reactivo

## 1. Estado inicial

### Archivos relevantes
- **Principal**: `src/game/scenes/GameScene.ts` (líneas 348-379, función `drawPerception`)
- **Constantes de visión**: `src/game/scenes/GameScene.ts` (líneas 28-29: `VISION_RANGE`, `FIELD_OF_VIEW`)
- **Tipos**: `src/domain/perception/perception.ts` → `VisionResult` (importado en línea 24)
- **Tests de regresión**: `tests/perception/perception.test.ts` (12 tests), `tests/guard/guardState.test.ts` (10 tests)

### Comportamiento actual (`drawPerception`, líneas 348-363)
```typescript
private drawPerception(vision: VisionResult): void {
  this.perceptionGraphics.clear();
  const facingAngle = Math.atan2(this.guardFacing.y, this.guardFacing.x);
  const halfFieldOfView = FIELD_OF_VIEW / 2;
  this.perceptionGraphics.fillStyle(vision.visible ? 0x73c991 : 0x6b8afd, 0.16);
  this.perceptionGraphics.beginPath();
  this.perceptionGraphics.moveTo(this.guard.x, this.guard.y);
  this.perceptionGraphics.arc(
    this.guard.x,
    this.guard.y,
    VISION_RANGE,
    facingAngle - halfFieldOfView,
    facingAngle + halfFieldOfView,
  );
  this.perceptionGraphics.closePath();
  this.perceptionGraphics.fillPath();
  // ... dibuja sonido y lastKnownMarker (sin cambios)
}
```
- **Reposo** (`visible: false`): Azul `#6b8afd`, α=0.16, sin borde explícito (solo fill)
- **Alerta** (`visible: true`): Verde `#73c991`, α=0.16, sin borde explícito
- **Diferencia**: Solo color de fill, mismo alpha, sin borde → feedback visual débil

### Validación de referencia existente
- `npm run validate` → pasa (typecheck + 48 tests + build)
- `npm run test:run` → 48 tests pasan (12 percepción + 10 FSM + 26 navegación/modelo)

### Cambios preexistentes a conservar
- Dibujo del cono con `arc()` usando `guardFacing`, `VISION_RANGE`, `FIELD_OF_VIEW`
- Dibujo de evento de sonido (círculo amarillo) y `lastKnownMarker` (rojo)
- HUD actualiza `vision ${VISION_LABELS[vision.reason]}` (línea 393)
- FSM y lógica de percepción intactas

---

## 2. Incrementos de trabajo

### Incremento 1: Definir paletas visuales y refactorizar drawPerception
- **Objetivo**: Extraer constantes de estilo y separar lógica de dibujo por estado
- **Archivo**: `src/game/scenes/GameScene.ts`
- **Cambio previsto**:
  1. Agregar constantes privadas al inicio de la clase (líneas ~52-50):
     ```typescript
     private static readonly CONE_REPOSO = { fillColor: 0x6b8afd, fillAlpha: 0.12, lineColor: 0x6b8afd, lineAlpha: 0.6, lineWidth: 2 };
     private static readonly CONE_ALERTA = { fillColor: 0xe16969, fillAlpha: 0.25, lineColor: 0xe16969, lineAlpha: 0.9, lineWidth: 3 };
     ```
  2. Refactorizar `drawPerception` para seleccionar paleta según `vision.visible` y usar `fillStyle` + `lineStyle` + `strokePath` además de `fillPath`
- **Criterio relacionado**: CA-01, CA-02 (estados visuales distintos)
- **Comprobación**: `npm run typecheck` + inspección visual en `npm run dev`
- **Riesgo**: Romper dibujo existente si `strokePath`/`fillPath` orden incorrecto
- **Condición de detención**: TypeScript errors o cono no se renderiza

### Incremento 2: Verificar caso oclusión (sin cambios de código)
- **Objetivo**: Confirmar que `reason: "occluded"` → `visible: false` → paleta reposo
- **Archivo**: Ninguno (solo verificación)
- **Cambio previsto**: Ninguno - el comportamiento ya es correcto porque `evaluateVision` retorna `visible: false` para ocluidos
- **Criterio relacionado**: CA-03
- **Comprobación**: `npm run dev` → posicionar jugador tras pared → verificar HUD `vision OCLUIDO` → cono en reposo
- **Riesgo**: Ninguno (solo verificación)
- **Condición de detención**: Si cono muestra alerta en oclusión → revisar `drawPerception` (debe usar solo `vision.visible`)

### Incremento 3: Ejecutar suite de regresión
- **Objetivo**: Validar que no se rompió nada
- **Archivo**: Ninguno
- **Cambio previsto**: Ninguno
- **Criterio relacionado**: CA-05, CA-06
- **Comprobación**: `npm run test:run` → 48 tests pasan; `npm run validate` → OK
- **Riesgo**: Regresión en percepción/FSM si se tocó algo accidental
- **Condición de detención**: Cualquier test falla → revertir cambios en `drawPerception`

### Incremento 4: Revisión final del diff
- **Objetivo**: Confirmar alcance mínimo
- **Archivo**: `src/game/scenes/GameScene.ts` (solo función `drawPerception` + 2 constantes)
- **Cambio previsto**: `git diff src/game/scenes/GameScene.ts`
- **Criterio relacionado**: Todos
- **Comprobación**: Diff muestra solo cambios en `drawPerception` y 2 constantes nuevas
- **Riesgo**: Cambios accidentales en otros métodos
- **Condición de detención**: Diff toca líneas fuera de `drawPerception` o constantes de estilo

---

## 3. Validación prevista

| Paso | Acción | Comando / Pasos manuales | Resultado esperado |
|---|---|---|---|
| **V-01** | Estado reposo | `npm run dev` → mover jugador a esquina opuesta (x≈100,y≈100) → observar cono | Cono: fill `#6b8afd` α=0.12, stroke `#6b8afd` α=0.6, width=2 |
| **V-02** | Estado alerta | `npm run dev` → mover jugador dentro del cono (sin paredes) → HUD `vision VISIBLE` | Cono: fill `#e16969` α=0.25, stroke `#e16969` α=0.9, width=3 |
| **V-03** | Caso oclusión | `npm run dev` → colocar jugador tras pared en rango/cono → HUD `vision OCLUIDO` | Cono: paleta reposo (igual V-01) |
| **V-04** | Tests regresión | `npm run test:run` | 48 tests pasan |
| **V-05** | Validación completa | `npm run validate` | typecheck + test + build = OK |
| **V-06** | Diff final | `git diff src/game/scenes/GameScene.ts` | Solo `drawPerception` + 2 constantes |

---

## 4. Restricciones

- ❌ No modificar `src/domain/` (perception, guard, navigation, model)
- ❌ No modificar `src/application/simulation/` (perceptionSimulation, labLevel, navigationDemo)
- ❌ No modificar `guardState.ts` ni FSM
- ❌ No agregar dependencias (`package.json` intacto)
- ❌ No agregar tween/animaciones (cambio inmediato)
- ❌ No agregar indicador sobre el jugador
- ❌ No implementar funcionalidades fuera de la spec
- ✅ Conservar todos los cambios del Parcial 1 (48 tests, HUD, patrulla, sonido, etc.)

---

## 5. Evidencia a registrar en `docs/upgrades/01-cono-vision-reactivo/evidencia.md`

Para cada validación (V-01 a V-06) se registrará:

```
### V-XX: [Nombre de la validación]
- **Caso ejecutado**: [descripción concreta]
- **Reproducción**: [pasos exactos con coordenadas/teclas]
- **Resultado esperado**: [valores visuales/numéricos precisos]
- **Resultado real observado**: [completar tras ejecución]
- **Caso límite verificado**: [si aplica, ej. "oclusión con geometría favorable"]
- **Salida npm run validate**: [pegar output completo de terminal]
```

Ejemplo para V-01:
```
### V-01: Estado reposo (visible: false)
- **Caso ejecutado**: Jugador en esquina superior izquierda, guardia en inferior derecha
- **Reproducción**: 
  1. `npm run dev`
  2. WASD mover jugador a (x≈96, y≈96) - celda (3,3) aprox
  3. Esperar guardia patrullar lejos
- **Resultado esperado**: Cono fill #6b8afd α=0.12, stroke #6b8afd α=0.6, width=2px
- **Resultado real observado**: [pendiente]
- **Caso límite verificado**: N/A
- **Salida npm run validate**: [pendiente]
```

---

**¿Aprobás este plan para proceder con el Incremento 1?**