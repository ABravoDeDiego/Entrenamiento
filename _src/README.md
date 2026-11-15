# Fuentes de la web

- `rutina.json`: única fuente para semana, reglas, sesiones, ejercicios, cargas, campos adicionales y cierre semanal. Editar aquí las actualizaciones habituales.
- `plantilla.html`: presentación, validación, almacenamiento y exportación. Cambiar solo cuando se modifica el funcionamiento o se aprueba una mejora de UX.
- `generar.py`: combina ambos archivos en el `index.html` autónomo de la raíz. Python 3, sin paquetes adicionales.

```sh
python _src/generar.py
python _src/generar.py --check
python _qa/generacion.py
node _qa/revision.cjs
```

`index.html` es un resultado generado: no editarlo a mano. Se incluye en el mismo commit que los cambios de fuentes. GitHub Pages sigue publicándolo por el procedimiento existente; no se añaden automatismos ni peticiones de red a la aplicación.

## Actualización habitual

1. Modificar solo los datos afectados de `rutina.json`.
2. Misma semana: conservar `week.storageKey` y los identificadores de registro. Semana nueva: cambiar semana, títulos, mensaje de borrado y clave; no copiar resultados.
3. Generar y comprobar el HTML. Ejecutar QA y publicar fuentes modificadas más `index.html` juntos.

Cada ejercicio mantiene el formato existente: `[grupo, nombre, rango, anterior, objetivo, tipo, series, id, nota]`. Los tipos permitidos son weight, body, control, time, side y parallel. Los campos adicionales están en `fields.scales` y `fields.texts`; sus claves son los identificadores persistentes de registro. El generador valida estructura y duplicados; no decide ni modifica cargas o programación.

Las carpetas con `_` contienen fuentes y revisión; el resultado público sigue siendo el HTML de la raíz. Los registros de entrenamiento permanecen en el navegador.
