# Python build-time tooling

Optional per-topic precomputation. Anything heavy (reference algorithm traces,
perplexity tables, Zipf rank-frequency data, sampled datasets) runs here at
build time and is emitted as JSON into `src/data/`, keeping the shipped site
fully static.

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r scripts/requirements.txt
```

## Run

```bash
npm run gen          # → python3 scripts/gen_all.py
```

## Adding a generator

1. Create `scripts/gen_<topic>.py` exposing:
   ```python
   from pathlib import Path
   def generate(out_dir: Path) -> list[Path]:
       ...
       return [out_dir / "<topic>.json"]
   ```
2. Register its module name in `GENERATORS` inside `gen_all.py`.

Interactive visualizations that need *live* computation implement the algorithm
in TypeScript under `src/lib/` instead (they're all small).
