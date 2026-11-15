"""Comprobaciones del generador sin dependencias externas."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("generar", ROOT / "_src/generar.py")
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)


class GeneratorTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / "_src/rutina.json").read_text())
        self.template = (ROOT / "_src/plantilla.html").read_text()

    def test_reproducible_output(self):
        self.assertEqual(generator.generate(self.data, self.template), (ROOT / "index.html").read_text())

    def test_next_week_changes_only_routine_source(self):
        data = copy.deepcopy(self.data)
        data["week"].update(heading="SEMANA DE PRUEBA", storageKey="entreno_prueba_nueva")
        data["days"][0]["ex"][1][4] = "Objetivo de prueba nuevo"
        result = generator.generate(data, self.template)
        self.assertIn('<h1>SEMANA DE PRUEBA</h1>', result)
        self.assertIn('"storageKey": "entreno_prueba_nueva"', result)
        self.assertIn("Objetivo de prueba nuevo", result)
        self.assertEqual(self.template, (ROOT / "_src/plantilla.html").read_text())

    def test_invalid_data_does_not_overwrite_last_html(self):
        data = copy.deepcopy(self.data)
        data["days"][1]["ex"][0][7] = data["days"][0]["ex"][0][7]
        with tempfile.TemporaryDirectory() as temp:
            source, output = Path(temp) / "rutina.json", Path(temp) / "index.html"
            source.write_text(json.dumps(data))
            output.write_text("Última versión válida")
            result = subprocess.run([sys.executable, str(ROOT / "_src/generar.py"), "--routine", str(source), "--output", str(output)], capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(output.read_text(), "Última versión válida")

    def test_unknown_schema_rejected(self):
        self.data["schemaVersion"] = 99
        with self.assertRaises(ValueError):
            generator.generate(self.data, self.template)

    def test_stale_generated_file_detected(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "index.html"
            output.write_text("Versión antigua")
            result = subprocess.run([sys.executable, str(ROOT / "_src/generar.py"), "--check", "--output", str(output)], capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(output.read_text(), "Versión antigua")

    def test_embedded_text_cannot_close_script(self):
        self.data["days"][0]["ex"][0][8] = '</script><script>example</script>'
        result = generator.generate(self.data, self.template)
        self.assertEqual(result.count('</script>'), 1)
        payload = result.split('const ROUTINE=')[1].split(';\nconst WEEK=')[0]
        self.assertEqual(json.loads(payload)["days"][0]["ex"][0][8], self.data["days"][0]["ex"][0][8])


if __name__ == "__main__":
    unittest.main(verbosity=1)
