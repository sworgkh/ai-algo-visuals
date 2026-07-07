# AI Algorithms — Exam Portal

Interactive visualization portal for **Algorithms in AI (3520103)** exam prep.
One section per course topic; the site is built one topic at a time. See
[`PROJECT.md`](./PROJECT.md) for the full brief, phase checklist, and changelog.

Stack: Vite · React 19 · TypeScript · React Router · Framer Motion · d3 · KaTeX.
Dark theme, fully static output.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build & preview

```bash
npm run build      # → dist/  (static)
npm run preview    # serve the production build locally
```

Deploy `dist/` to any static host. SPA deep-link fallback is preconfigured for
Netlify (`public/_redirects`) and Vercel (`vercel.json`). For sub-path hosting,
set `base` in `vite.config.ts`.

## Optional Python precompute

Some topics precompute data at build time → `src/data/*.json`. See
[`scripts/README.md`](./scripts/README.md). Run with `npm run gen`.

## Project structure

```
src/
├── theme/tokens.css     design tokens (dark blue/purple)
├── components/          shell + shared primitives (Sidebar, StepPlayer, FormulaBlock, Bars, Icons)
├── hooks/               useStepPlayer
├── lib/                 shared TS (graph geometry; algorithm impls land here per topic)
├── pages/               Home, ComingSoon, NotFound
├── topics/              registry.ts (source of truth) + one folder per built topic
└── data/                checked-in precomputed JSON
```

## Add a topic

Build its page under `src/topics/topicNN-<slug>/`, then in `src/topics/registry.ts`
set `Component: lazy(() => import(...))` and flip `status` to `'available'`.
The sidebar, router, and Home grid update automatically.
