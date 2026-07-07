#!/usr/bin/env python3
"""Build-time data generation entry point.

Runs every registered topic generator and writes JSON into ``src/data/``.
Kept intentionally tiny: each topic that needs precomputation adds a
``gen_<topic>.py`` exposing ``generate(out_dir: Path) -> list[Path]`` and
registers it in ``GENERATORS`` below.

Usage:
    npm run gen          # from the project root
    python3 scripts/gen_all.py
"""
from __future__ import annotations

import importlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data"

# Module names under scripts/ to run, in order. Populated one topic at a time.
# e.g. "gen_nlp" (Zipf tables), "gen_search" (reference traces).
GENERATORS: list[str] = []


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not GENERATORS:
        print("No generators registered yet — nothing to precompute.")
        print(f"(Data dir ready at {DATA_DIR.relative_to(ROOT)})")
        return

    written: list[Path] = []
    for name in GENERATORS:
        module = importlib.import_module(name)
        produced = module.generate(DATA_DIR)  # type: ignore[attr-defined]
        written.extend(produced)
        print(f"✓ {name}: {', '.join(p.name for p in produced)}")

    print(f"\nWrote {len(written)} file(s) to {DATA_DIR.relative_to(ROOT)}.")


if __name__ == "__main__":
    main()
