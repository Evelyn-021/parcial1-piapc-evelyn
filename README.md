# Plantilla PIAPC para repositorios individuales

Esta plantilla prepara un repositorio publico e individual para proyectos academicos de videojuegos. Es independiente del motor, lenguaje y tipo de juego.

## Como usarla

1. Crea un repositorio individual desde esta plantilla y conserva el commit inicial.
2. Completa los datos de este archivo y de `GDD.md` cuando la consigna defina el problema de diseno.
3. Agrega el proyecto creado con el motor elegido, sin mezclar archivos de otros motores.
4. Incorpora al `.gitignore` las reglas oficiales o recomendadas para ese motor.
5. Completa los documentos de `docs/` en el orden indicado por `docs/README.md`.
6. Conserva commits pequenos y revisables durante el desarrollo.

## Datos del proyecto

- Estudiante: Alonso, Evelyn
- Materia, comisión y año: Programación de IA y patrones de comportamiento
- Nombre del proyecto: Guardia de Sigilo - Parcial 1
- Motor y version: Phaser 3.90.0 + TypeScript 5.9.3 + Vite 6.4.3
- Estado: Finalizado / Entregado

## Descripcion

Prototipo de sigilo 2D cenital centrado en el comportamiento de un guardia. La intervención implementa una máquina de estados finita con los estados Patrullar, Investigar y Perseguir, utilizando percepción sonora y visual. La visión tiene prioridad sobre el sonido y el estado actual del guardia se muestra en el HUD.

## Requisitos y ejecucion

Requisitos:
- Node.js 22 o superior
- npm

Para ejecutar el proyecto:

```bash
npm install
npm run dev
```

## Controles

[Describe los controles disponibles o indica que todavia no existen.]

## Creditos

[Declara assets, sonidos, tipografias, plugins, codigo, referencias y licencias de terceros.]

## Entrega o demostracion

[Agrega el enlace a una compilacion, video o publicacion cuando la entrega lo requiera.]
