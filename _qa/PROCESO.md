# Actualizaciones con contexto mínimo

1. Leer `main` una vez y conservar SHA + árbol. Comparar contenido remoto y local sin imprimir el HTML completo.
2. Extraer programación y revisar solo diferencias de la nueva rutina: grupos, anteriores, objetivos, notas y campos. No reconstruir lo que no cambia.
3. Misma semana: conservar clave e identificadores. Semana nueva: clave nueva, sin copiar resultados. Campos retirados se conservan almacenados; no se reinterpretan registros ambiguos.
4. Modificar solo las partes afectadas. Mantener pruebas estables; añadir casos por cambios de comportamiento, evitando rehacer toda la batería semanal.
5. Ejecutar una revisión de sintaxis y la batería pertinente. Salida habitual: recuento y fallos; detalle completo en `results.json`. Repetir solo si hay cambios o fallos.
6. Revisar visualmente las tarjetas nuevas o modificadas. No repetir capturas de pantallas idénticas.
7. Publicar archivos modificados juntos con comprobación del SHA esperado. Confirmar contenido remoto sin imprimirlo. Esperar despliegue y verificar una vez la versión y las partes afectadas en la web.
8. Respuesta breve: versión, cambios relevantes, QA y limitación real. No repetir la rutina ni logs. No afirmar porcentajes de ahorro de tokens sin medición disponible.

Mantener HTML simple y las decisiones de UX. Separar datos de rutina y plantilla, automatizar publicación o cambiar validaciones generales requieren propuesta y aprobación previas.
