"""Genera el HTML autónomo; no requiere instalar dependencias."""
import argparse
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TYPES = {"weight", "body", "control", "time", "side", "parallel"}


def validate(data):
    if data.get("schemaVersion") != 1:
        raise ValueError("schemaVersion debe ser 1")
    for key in ("title", "heading", "subtitle", "storageKey"):
        if not isinstance(data["week"].get(key), str) or not data["week"][key].strip():
            raise ValueError("Falta week." + key)
    if not data["days"]:
        raise ValueError("Debe existir al menos una sesión")
    ids, exercises = set(), set()
    for day in data["days"]:
        if not re.fullmatch(r"[a-z][a-z0-9_]*", day["id"]) or day["id"] in ids or day["id"] in {"sleep", "weekly"}:
            raise ValueError("Identificador de sesión inválido o duplicado: " + day["id"])
        ids.add(day["id"])
        for field in ("tab", "title", "session"):
            if not day.get(field):
                raise ValueError("Falta " + field + " en " + day["id"])
        for e in day["ex"]:
            if len(e) != 9 or e[5] not in TYPES or type(e[6]) is not int or e[6] < 1:
                raise ValueError("Ejercicio inválido en " + day["id"])
            if not re.fullmatch(r"[a-z][a-z0-9_]*", e[7]) or e[7] in exercises:
                raise ValueError("Ejercicio duplicado o identificador inválido: " + e[7])
            exercises.add(e[7])
        if day.get("cardio"):
            c = day["cardio"]
            if c["id"] in exercises or not re.fullmatch(r"[a-z][a-z0-9_]*", c["id"]):
                raise ValueError("Cardio duplicado o identificador inválido")
            if c["type"] not in {"treadmill", "bike"}:
                raise ValueError("Tipo de cardio inválido")
            exercises.add(c["id"])
    for field in ("scales", "texts", "optionalSets"):
        if not isinstance(data["fields"].get(field), dict):
            raise ValueError("fields." + field + " debe ser un objeto")
        if set(data["fields"][field]) - exercises:
            raise ValueError("Campos asociados a ejercicios inexistentes: " + field)
    if any(pair[0] not in ids for pair in data["weekly"]["sessions"]):
        raise ValueError("Cierre semanal asociado a sesión inexistente")
    keys = [pair[0] for pairs in data["fields"]["scales"].values() for pair in pairs]
    keys += [pair[0] for pairs in data["fields"]["texts"].values() for pair in pairs]
    keys += [pair[0] for pair in data["weekly"]["texts"]]
    if len(keys) != len(set(keys)):
        raise ValueError("Campos de registro duplicados")
    if not data.get("resetMessage"):
        raise ValueError("Falta el mensaje de borrado semanal")


def generate(data, template):
    validate(data)
    # El JSON embebido no puede cerrar el bloque script.
    payload = json.dumps(data, ensure_ascii=False, indent=2)
    for char in ("<", ">", "&", "\u2028", "\u2029"):
        payload = payload.replace(char, "\\u%04x" % ord(char))
    values = {
        "PAGE_TITLE": html.escape(data["week"]["title"]),
        "WEEK_HEADING": html.escape(data["week"]["heading"]),
        "WEEK_SUBTITLE": html.escape(data["week"]["subtitle"]),
        "RULES": '<div class="card">' + "".join(
            '<div class="meta' + (' muted' if rule.get("muted") else '') + '">'
            + html.escape(rule["text"]) + '</div>' for rule in data["rules"]
        ) + '</div>',
        "ROUTINE_JSON": payload,
    }
    expected = set(values)
    found = re.findall(r"\{\{([A-Z_]+)\}\}", template)
    if set(found) != expected or len(found) != len(expected):
        raise ValueError("Marcadores de plantilla ausentes, desconocidos o repetidos")
    return re.sub(r"\{\{([A-Z_]+)\}\}", lambda m: values[m[1]], template)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Comprueba que index.html esté actualizado sin escribir")
    parser.add_argument("--routine", type=Path, default=ROOT / "_src/rutina.json")
    parser.add_argument("--output", type=Path, default=ROOT / "index.html")
    args = parser.parse_args()
    try:
        data = json.loads(args.routine.read_text(encoding="utf-8"))
        result = generate(data, (ROOT / "_src/plantilla.html").read_text(encoding="utf-8"))
        if args.check:
            if not args.output.exists() or args.output.read_text(encoding="utf-8") != result:
                raise ValueError("index.html no coincide; ejecuta python _src/generar.py")
            print("OK: index.html coincide con rutina y plantilla")
        else:
            args.output.write_text(result, encoding="utf-8")
            print("Generado: " + str(args.output))
    except (ValueError, KeyError, TypeError, IndexError, OSError) as error:
        parser.exit(1, "Error de generación: " + str(error) + "\n")


if __name__ == "__main__":
    main()
