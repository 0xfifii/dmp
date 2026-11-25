"""Rebuilds index.html and admin.html from the templates and SVG art in this folder.
Run from the project root:  python3 build/build.py"""
import pathlib
b = pathlib.Path(__file__).parent
root = b.parent
art = {k: (b / f).read_text() for k, f in {
    "LOGO": "logo.svg", "SHIP": "ship.svg", "STACK": "stack.svg", "C20": "c20.svg", "C40": "c40.svg", "CHC": "chc.svg"}.items()}
art["RIBS"] = "".join(f'<line x1="{x}" y1="92" x2="{x}" y2="280"/>' for x in range(70, 500, 22))
for tpl, out in (("index.tpl.html", "index.html"), ("admin.tpl.html", "admin.html")):
    t = (b / tpl).read_text()
    for k, v in art.items():
        t = t.replace("{{" + k + "}}", v)
    assert "{{" not in t, out
    (root / out).write_text(t)
    print("built", out, len(t))
