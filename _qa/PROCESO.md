# Actualizaciones con contexto mínimo

1. Obtener SHA + árbol de `main` y leer `_src/rutina.json` una vez. Leer la plantilla solo si cambia el funcionamiento; no imprimir el HTML completo.
2. Extraer programación y revisar solo diferencias de la nueva rutina: grupos, anteriores, objetivos, notas y campos. No reconstruir lo que no cambia.
3. Misma semana: conservar clave e identificadores. Semana nueva: clave nueva, sin copiar resultados. Campos retirados se conservan almacenados; no se reinterpretan registros ambiguos.
4. Modificar solo `_src/rutina.json` para cambios de programación. Ejecutar `python _src/generar.py` y `python _src/generar.py --check`. No editar `index.html` manualmente. Mantener pruebas estables; añadir casos por cambios de comportamiento.
5. Ejecutar una revisión de sintaxis y la batería pertinente. Si cambia el generador, ejecutar `python _qa/generacion.py`. Salida habitual: recuento y fallos; detalle completo en `results.json`. Repetir solo si hay cambios o fallos.
6. Revisar visualmente las tarjetas nuevas o modificadas. No repetir capturas de pantallas idénticas.
7. Publicar fuentes modificadas e `index.html` generado juntos con comprobación del SHA esperado. Confirmar contenido remoto sin imprimirlo. Esperar despliegue y verificar una vez la versión y las partes afectadas en la web.
8. Respuesta breve: versión, cambios relevantes, QA y limitación real. No repetir la rutina ni logs. No afirmar porcentajes de ahorro de tokens sin medición disponible.

Mantener HTML simple y las decisiones de UX. La separación de datos y plantilla está aprobada y aplicada: ver [fuentes](../_src/README.md). Automatizar publicación o cambiar validaciones generales requiere propuesta y aprobación previas.
