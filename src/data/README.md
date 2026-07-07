# Precomputed data

Checked-in JSON consumed by topic visualizations, so the site stays 100% static.

Heavy or reference computations run in Python at build time (`scripts/gen_*.py`)
and emit files here (e.g. `search.json`, `zipf.json`). Small live computations
(the interactive algorithms themselves) are implemented in TypeScript under
`src/lib/` and run in the browser.

Regenerate everything with:

```bash
npm run gen
```

This folder is empty until the first topic that needs precomputation lands.
