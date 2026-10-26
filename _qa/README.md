# Revisión de rutina y funcionamiento

La aplicación sigue siendo un único `index.html`. Esta carpeta contiene únicamente herramientas de revisión; no añade funciones a la web. GitHub Pages/Jekyll excluye por defecto las carpetas que empiezan por `_`.

## Antes de editar

1. Obtener el `index.html` actual de `main` y conservar su SHA.
2. Comparar con la rutina enviada: semana, orden, grupos, modalidad, número de series, rangos, anteriores, objetivos, RIR, calentamientos, descansos y precauciones. Comprobar también cardio, cierre y sueño.
3. Si no cambia la prescripción ni hay una corrección aprobada, conservar el HTML. Evitar commits de rutina sin cambios.
4. Para una revisión de la misma semana, conservar la clave de almacenamiento y los identificadores de los campos. Crear una clave distinta solo para una semana nueva.
5. Presentar cualquier propuesta de UX o de comportamiento antes de implementarla. No reprogramar el entrenamiento desde el desarrollo.

## Prueba automática local

Requisitos: Node.js y Playwright con sus navegadores. Desde la raíz del repositorio:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium webkit
node _qa/revision.cjs
```

El script abre un servidor local temporal con el HTML y crea contextos de navegador independientes. No conecta con la web publicada ni usa registros del usuario. Los resultados y capturas se escriben en una carpeta temporal; su ubicación aparece en la salida. Se puede elegir otra con `QA_OUTPUT_DIR`.

Si el entorno ya tiene Chromium, se puede indicar su ruta con `QA_CHROMIUM_EXECUTABLE`. No se incluyen navegadores ni dependencias en el repositorio.

Las comprobaciones de fidelidad de series están fijadas para la semana 26–30 de octubre de 2026: deben actualizarse desde la nueva prescripción, nunca copiarse automáticamente del HTML a comprobar. La revisión textual completa de cargas y precauciones sigue siendo necesaria.

## Qué comprobar

- Arranque real y errores de ejecución durante todo el recorrido, además de sintaxis.
- Seis pestañas, campos vacíos y fidelidad de las series prescritas.
- Registro por formulario, RIR, cero explícito, coma decimal, comentarios y exportación.
- Copia al portapapeles, recarga e invalidación de resúmenes tras editar o cambiar de sesión.
- Carrera parcial, cálculo de media, rodilla durante y seguimiento al día siguiente.
- Cardio dual, bici omitida, descanso y campos condicionales.
- Bloque de piernas omitido y reactivado, conservando cargas y RIR.
- Paralelas realizadas u omitidas: no exportar valores antiguos de un apoyo omitido ni añadir series de tríceps no prescritas.
- Sueño parcial y horas inválidas.
- Cancelación y confirmación del borrado, sin borrar otras semanas.
- Almacenamiento inválido, campos sin identificadores duplicados y ancho móvil de 390 px.
- Fecha al actualizar una sesión al día siguiente y coherencia entre tiempo y distancia.

## Informe y publicación

Cada comprobación informa `PASS`, `FAIL` o `NO EJECUTADO`. Si un navegador no arranca, se registra como no ejecutado, nunca como superado. Un error que interrumpe el recorrido queda registrado y devuelve una salida de fallo. El proceso también falla si no se pudo ejecutar ninguna prueba en Chromium.

WebKit automatizado no equivale a una prueba en Safari de un iPhone real. Informar esa limitación por separado.

Antes de publicar, volver a comprobar el SHA remoto. Tras publicar, comprobar el despliegue y abrir la web para confirmar la semana servida y el arranque. No probar el botón de borrado en el navegador habitual del usuario.

## Revisión del 26 de octubre de 2026

La rutina reenviada no cambia la prescripción de la V7 publicada. Se conserva `index.html` y la clave de datos de esta semana.

- **PASS:** 19 comprobaciones en Chromium a 390 × 844 px.
- **NO EJECUTADO:** WebKit y Safari real.
- **FAIL:** al añadir la rodilla al día siguiente y regenerar el resumen, `Realizada` cambia al día de la nueva exportación.
- **FAIL:** se permite exportar una distancia positiva con tiempo total de cero minutos y velocidad `—`.

Los dos fallos se reprodujeron en el script y quedaron pendientes de aprobación; no se trataron como resultados esperados para dar un verde artificial. La revisión inicial no modificó la interfaz ni el registro existente.


## Correcciones aprobadas y verificadas el 26 de octubre de 2026

- Cada sesión conserva la fecha de su primer resumen válido, incluso al regenerarlo para añadir la rodilla al día siguiente. La fecha persiste en la misma clave semanal de almacenamiento.
- Si existe un resumen anterior guardado, se recupera su fecha antes de invalidar la salida al abrir. Si no se conserva una fecha anterior, se usa la del primer resumen válido generado con esta versión, sin inferir el día de entrenamiento.
- Carrera, cinta y bici bloquean la exportación cuando la distancia es positiva y el tiempo correspondiente es cero. El aviso usa el listado de validación existente. Cero tiempo y cero distancia siguen permitidos; las omisiones y el descanso ignoran los datos de bloques omitidos.
- **PASS:** 28 comprobaciones de Chromium, incluidas las dos regresiones, persistencia de fecha, recuperación de fecha anterior, fecha independiente por sesión, cinta, bici y omisiones.
- **NO EJECUTADO:** WebKit y Safari real.
- No cambian prescripciones, distribución visual, campos de entrenamiento ni la clave semanal.
