# AI Algorithms Exam Portal — Claude Code Project Brief

> **You are Claude Code.** This document is your project brief, your layout, and your progress tracker for building an interactive visualization portal that complements a TDD-style exam-prep study session for the course *Algorithms in AI* (3520103). Read it fully before writing a single file.

---

## 1. Mission

Build **one static portal** of powerful, beautiful, interactive visualizations — one section per course topic (10 topics). The portal complements markdown study notes the student already has; its job is to make the *mechanics* of each algorithm visible: watch BFS flood a grid, watch POP resolve a threat, watch probability mass flow through a Bayesian network, watch particles die and resample.

**Prime directive on pacing:** ❗ **Implement ONE topic at a time, and ONLY when the user explicitly instructs you to.** Never build ahead. After finishing a topic, update the checklist in this file, present the result, and stop. The user is studying topic-by-topic; the portal must follow their pace, not yours.

## 2. Hard Constraints

| Constraint | Detail |
|---|---|
| **Final output is 100% static** | The built site must be plain HTML/CSS/JS servable from any static host (e.g., `dist/`). No server, no API calls, no runtime backend. |
| **Frontend: React** | Vite + React (TypeScript recommended). Choose your own supporting libs (d3, framer-motion, KaTeX for formulas, etc.) — you have freedom. |
| **Build/dev tooling: anything goes** | Python is available and encouraged for precomputation: generating datasets, running reference implementations of the algorithms (filtering numbers, perplexity tables, search traces), and emitting JSON consumed by the frontend. Heavy math belongs in build-time Python or in small, well-tested TS ports — your call per topic. Interactive visualizations that need live computation should implement the algorithm in TS (they're all small). |
| **LaTeX rendering is mandatory** | The portal MUST render mathematical formulas beautifully — this is a math-heavy course and formulas are first-class content, not decoration. Use **KaTeX** (recommended: fast, static-friendly) or MathJax. Every topic page needs the ability to: display standalone equations (filtering recursion, Bayes' rule, perplexity, global semantics Π P(xi\|parents)), render **inline** math within step captions, and — ideally — **highlight/animate parts of a formula in sync with the visualization step** (e.g., the Σ prediction term glows while the belief bars shift, then the α·P(e\|X) term glows during the update). Build a shared `FormulaBlock` component in Phase 0 that supports per-term highlighting. |
| **Animation engine: your choice** | Free pick: **Remotion** (pre-rendered explainer sequences exported as video/frames at build time — fits the static constraint), **Framer Motion**, **react-spring**, raw CSS/`d3-transition`, or a mix. Guidance: interactive step-through visualizations are usually better served by Framer Motion / d3 (user-controlled state); Remotion shines for polished non-interactive "watch how it works" intro clips per topic. Choose per visualization; whatever you pick must survive the static build. |
| **Left-side navigation** | Modern app shell: collapsible left sidebar listing the 10 topics (+ Home/Overview), content area on the right. Topics not yet implemented appear in the nav but disabled/greyed with a "coming soon" state. |
| **Dark mode only** | NOT pure black. A refined modern dark theme with **blue/purple tints**: e.g., backgrounds in the `#0f1117`–`#1a1d2e` range, surfaces slightly lighter, indigo/violet accents (`#6366f1`, `#8b5cf6`, `#a78bfa`), cool desaturated text (`#c9cdd6`), subtle glows on interactive elements. Consistent design tokens (CSS variables) from day one. Typography and spacing should feel like a polished product, not a homework page. |
| **This is an open document** | Everything below the constraints is *suggestion*, not specification. You have full freedom to choose better visualizations, libraries, and interactions — as long as they teach the concept clearly and look excellent. Deviate when you have a better idea; note the deviation in the checklist. |

## 3. Exam Context (why these visualizations)

The exam has two parts: (A) true/false statements graded almost entirely on *reasoning*, and (B) open computational questions — historically **POP planning, Bayesian network inference, and HMM filtering**. Visualizations should therefore favor:
- **Step-through mode** (next/prev buttons + autoplay) so the student can narrate the reasoning at each step — that narration *is* the exam skill.
- **Editable inputs with live recomputation** — the exam gives concrete numbers; the student must practice cranking them.
- **"Why" annotations** at each step, not just animation.

## 4. The Ten Topics & Visualization Suggestions

*(Suggestions. You decide the final design.)*

### Topic 1 — Search Foundations
Concepts: formal search problem, BFS/DFS/IDDFS/UCS, Greedy & A*, admissible/consistent heuristics, complexity O(b^d) vs O(b·m).
Ideas:
- Interactive grid/graph playground: place start/goal/walls, pick an algorithm, watch frontier vs. explored set expand step-by-step; color-code frontier (queue/stack/priority) contents shown as a live data-structure panel.
- Side-by-side race: BFS vs DFS vs A* on the same map with node-expansion counters and a memory meter (dramatize BFS's O(b^d) frontier).
- Heuristic explorer: toggle h between 0 / Manhattan / inflated (inadmissible) and watch A* optimality break.
- Small chart: nodes expanded vs. depth for b=2,3,4 (log scale) — the exponential wall.

### Topic 2 — Planning, STRIPS & POP  ⭐ exam Part B
Concepts: search vs planning, STRIPS (PRECOND/EFFECT, add/delete lists), forward vs backward (regression) search, planning heuristics, partial-order planning, POP: causal links, open preconditions, threats, promotion/demotion.
Ideas:
- **POP plan canvas** (the crown jewel): nodes = actions (Start/Finish included), arrows = ordering constraints, highlighted arrows = causal links with their protected literal; open preconditions glow; when a threat appears, flash the threatened link and offer promote/demote buttons; show why one choice fails.
- Preload the exam's blocks world (Move / MoveToTable) with the sample-exam start/goal states, plus 1–2 other scenarios.
- Regression visualizer: show a goal set as chips; apply an action; animate removal of achieved literal + insertion of preconditions.
- STRIPS state machine: a state as a set of literal chips, apply action → delete-list chips fade out, add-list chips pop in.

### Topic 3 — Planning in the Real World
Concepts: hierarchical planning / HTN (HLA, refinements, primitives), scheduling with durations, **critical path method** (ES/LS/slack), reusable vs consumable resources, conformant/contingent/online planning.
Ideas:
- HTN decomposition tree: click an HLA → it expands into alternative refinements (the SFO-airport example), down to primitives.
- **Critical-path lab**: editable DAG of actions with durations (preload the sample exam's action graph); compute & animate ES forward pass and LS backward pass; critical path glows red, slack shown as translucent bars on a Gantt strip. This is a literal exam question — make the arithmetic visible.
- Resource timeline: reusable resource (lane occupied → freed) vs consumable (a depleting fuel bar) — a 10-second visual that kills the exam's false definition forever.
- Belief-state demo for conformant planning: several candidate world states shrink to one as actions/observations occur.

### Topic 4 — Quantifying Uncertainty
Concepts: probability axioms, joint distributions, inference by enumeration, marginalization, normalization (α), independence & conditional independence, Bayes' rule, naïve Bayes.
Ideas:
- Joint-distribution heat table (toothache/cavity/catch): click to select a query, watch cells being summed for enumeration; normalization shown as a bar rescale.
- Bayes-rule "mass flow" diagram: priors as areas, likelihoods reshaping them, posterior after renormalization; sliders for P(disease), sensitivity, false-positive rate.
- Parameter-count comparison: full joint 2^n−1 vs naïve Bayes 2n+1 as n slider grows — an exponential vs linear curve.
- Conditional-independence toggle: with/without knowing Cavity, show how Toothache correlates (or not) with Catch via scatter/frequency panels.

### Topic 5 — Bayesian Networks ⭐ exam Part B
Concepts: DAG + CPTs, global semantics Π P(xi|parents), Markov blanket, variable ordering when constructing, compactness, explaining away, enumeration & variable elimination.
Ideas:
- **The burglary network, live**: the classic B,E → A → J,M graph with editable CPTs; click any query like P(J ∧ ¬M | B) and watch the sum over hidden variables unfold term-by-term with a running expression (KaTeX) — exactly the exam Part B computation.
- Markov-blanket highlighter: hover a node → blanket glows, everything else dims.
- Ordering experiment: rebuild the network under a bad ordering (M,J,E,B,A) and count arcs/parameters vs the causal ordering — the exam T/F on ordering, visualized.
- Variable elimination trace: factors as cards that merge (pointwise product) and shrink (sum-out), with size counters.

### Topic 6 — Temporal Models: Filtering, Prediction, Smoothing, Viterbi
Concepts: time slices, Markov & sensor assumptions, filtering recursion (predict→update), prediction decay to stationary distribution, forward-backward smoothing, Viterbi.
Ideas:
- **Umbrella-world simulator**: timeline of days; toggle each day's umbrella observation; two stacked probability bars per day show P(Rain) evolving; step-through shows predict (bar shifts toward 0.5) then update (evidence reweights + normalize) with the actual numbers (0.5→0.818→0.883→…). Preload the exam's u=T,T,F sequence.
- Prediction-decay chart: run prediction k steps ahead with no evidence, watch convergence to the stationary <0.5,0.5>.
- Smoothing comparison: filtered vs smoothed estimates for the same sequence, plotted together — future evidence bending the past.
- Viterbi trellis: states × time lattice; max-paths thicken; backpointers traced on completion; toggle "sum (filtering) vs max (Viterbi)" to show they're the same recursion shape.

### Topic 7 — Hidden Markov Models ⭐ exam Part B
Concepts: single discrete state variable, T and O matrices, matrix form of filtering/smoothing/Viterbi, applications, mega-variable blowup.
Ideas:
- Matrix-machine view: show f as a column vector, animate Tᵀ·f (prediction) then O·(·) (update) then α-normalize, with actual matrices rendered and numbers flowing.
- Mega-variable blowup slider: k boolean variables → 2^k×2^k transition matrix rendered as an exploding grid.
- Mini speech-recognition toy: 3 hidden phonemes, noisy observations, decode with Viterbi.

### Topic 8 — DBN & Particle Filtering
Concepts: DBN structure (intra/inter-slice arcs), HMM vs DBN factorization, intractability of exact inference, particle filtering (sample → weight → resample).
Ideas:
- **Particle-filter robot localization**: a 1D/2D corridor; N particles as dots; step: particles drift (transition sampling), get sized by weight after a sensor reading, then resample (dots teleport to survivors); watch the cloud converge on the robot. Slider for N; a "deprivation" scenario.
- DBN vs HMM parameter counter: factored slice model vs flattened mega-variable, numbers side by side.
- Unrolling animation: slice template stamped across t=0..5, then the belief-state factor graph tangling up — why exact inference dies.

### Topic 9 — NLP Foundations
Concepts: NLP tasks (classification, NER, MT, coreference), three ambiguity types, traditional pipeline vs neural end-to-end, corpora, tokenization/lemmatization/stemming, Zipf's law, OOV.
Ideas:
- Ambiguity gallery: "I saw the man with the telescope" with two parse illustrations that toggle; the bank word-sense flip; a coreference-arrow demo on the John/Einstein's paragraph (the lecture's flagship example).
- Pipeline vs end-to-end diagram with an "error propagation" mode: inject a POS error and watch it cascade.
- **Zipf explorer**: paste any text (or use a bundled corpus precomputed in Python at build time) → log-log rank-frequency plot with the 1/rank reference line; type/token counters; OOV rate as you split train/test.
- Tokenize/lemmatize/stem playground on sample sentences.

### Topic 10 — Language Models
Concepts: LM definition, bag of words, n-gram models + Markov assumption, MLE estimation, chain rule vs bigram trap, perplexity (lower=better), Laplace/backoff/interpolation smoothing.
Ideas:
- **N-gram lab**: tiny editable corpus (preload the lecture's "the cat sat on the mat" corpus); live bigram count table & probability table; type a test sentence → per-word probability chips, log-prob sum, and perplexity, recomputed live.
- Smoothing switcher: MLE / Laplace / interpolation radio buttons; watch a zero-probability sentence go from PP=∞ to finite; show where Laplace steals mass (before/after bar chart of a row).
- Next-word predictor: type a prefix, see the model's ranked next-word distribution as bars; a "generate" button that samples a silly sentence — visceral proof of what an LM is.
- Chain rule vs bigram side-by-side formula panel (KaTeX) highlighting exactly which conditioning context each keeps — the exam's trap question, disarmed.

## 5. Project Layout

```
exam-portal/
├── PROJECT.md                  ← this file; keep the checklist updated
├── package.json / vite.config.ts / tsconfig.json
├── scripts/                    ← Python build-time tooling (optional per topic)
│   ├── requirements.txt
│   └── gen_<topic>.py          ← emits src/data/<topic>.json
├── src/
│   ├── main.tsx / App.tsx
│   ├── theme/tokens.css        ← dark blue/purple design tokens
│   ├── components/             ← shell: Sidebar, TopicPage, StepPlayer, shared viz primitives
│   ├── topics/
│   │   ├── topic01-search/
│   │   ├── topic02-pop/
│   │   └── ... one folder per topic, self-contained
│   ├── data/                   ← precomputed JSON (checked in, so the site stays static)
│   └── lib/                    ← TS algorithm implementations shared by topics
└── dist/                       ← static build output
```

Shared primitives worth building once (during Phase 0/1): a **StepPlayer** control (prev/next/play/speed/reset + step caption), a **FormulaBlock** (KaTeX), probability **BarPair/BarStack** components, and a graph-rendering helper.

## 6. Phases & Checklist  ← keep this updated after every work session

### Phase 0 — Foundation ✅ (complete)
- [x] Vite + React + TS scaffold, routing (BrowserRouter), static build verified (`dist/` served from any static host; SPA fallback via `_redirects` + `vercel.json`)
- [x] Design tokens: dark blue/purple palette, typography, spacing, focus states (`src/theme/tokens.css`)
- [x] App shell: collapsible left sidebar with all 10 topics (locked/greyed state for unbuilt ones), Home page with course/exam overview
- [x] Shared primitives: StepPlayer (+`useStepPlayer` hook), FormulaBlock (KaTeX, **per-term highlight** via `term()` helper), BarPair/BarStack, graph geometry helper (`src/lib/graph.ts`)
- [x] Animation engine decision recorded in changelog (Framer Motion + d3; Remotion deferred) with rationale
- [x] Python tooling skeleton (`scripts/`, requirements.txt, `gen_all.py`) + `npm run gen` hook

### Phase 1 — Topics (ONE AT A TIME, USER-TRIGGERED ONLY)
- [x] Topic 1: Search Foundations
- [x] Topic 2: Planning, STRIPS & POP ⭐
- [x] Topic 3: Real-World Planning (critical path!) 
- [x] Topic 4: Uncertainty & Probability
- [x] Topic 5: Bayesian Networks ⭐
- [x] Topic 6: Temporal Models (umbrella world!)
- [x] Topic 7: HMM ⭐
- [x] Topic 8: DBN & Particle Filtering
- [x] Topic 9: NLP Foundations
- [ ] Topic 10: Language Models

*Per-topic definition of done:* interactive viz(es) with step-through where relevant · exam-relevant preset scenarios preloaded · "why" captions per step · responsive within the shell · no console errors · static build still works · checklist + a one-line changelog entry updated here.

### Phase 2 — Polish (after all topics, on request)
- [ ] Cross-topic home dashboard (progress, quick links)
- [ ] Keyboard navigation for StepPlayer, a11y pass
- [ ] Performance pass (code-splitting per topic)
- [ ] Final static build + deployment instructions

## 7. Working Rules

1. **Wait for instruction.** Build Phase 0 when told to start. Then build exactly the topic the user names — nothing more.
2. **Correctness first.** The visualized numbers must match the real algorithms (the study notes contain worked examples — e.g., umbrella filtering <0.818,0.182>→<0.883,0.117>; validate against them). A beautiful wrong animation is worse than none.
3. **Freedom with accountability.** You may replace any suggested visualization with a better one; record the decision in the changelog below.
4. **Static means static.** If a feature needs runtime computation, implement it in TS in-browser; if it needs heavy precomputation, do it in Python at build time and ship JSON.

## 8. Changelog
*(append one line per completed unit of work)*

- **Topic 1 — Search Foundations.** Tested grid-search engine `src/lib/search.ts` (+ `search.test.ts`, 6 tests): one best-first loop parameterized by strategy — BFS (FIFO), DFS (LIFO), UCS (min g), Greedy (min h), A* (min g+h) — on a 4-connected grid with Manhattan h and the standard toward-goal tie-break; records a full frontier/explored/expanded trace. Asserts BFS/UCS/A* agree on optimal cost (open grid = 10; walled detour = 8), A* expands ≤ (and here <) UCS, and every strategy returns a valid start→goal path. Three tabs (`?tab=`): **Pathfinding lab** (step-through grid, strategy switch, click-to-toggle walls, colored frontier/explored/current/path + live expanded/cost stats), **Strategy race** (all five on one map — BFS 112 / UCS 108 / A* 45 / Greedy 28 nodes, optimal-cost + informed/optimal property badges), **Complexity & heuristics** (bᵈ vs b·m sliders on a log axis + admissible h≤h\* / consistent h≤c+h′ KaTeX cards). All use VizGuide.

- **Phase 0 — Foundation.** Scaffolded Vite + React 19 + TS. Shell: collapsible `Sidebar` (reads a single `topics/registry.ts`), `App` layout, `Home` (course/exam overview + topic grid + live per-term formula showcase), `ComingSoon`/`NotFound`, `TopicRoute` dispatcher. Shared primitives: `FormulaBlock` (KaTeX + `term()` per-term highlight), `useStepPlayer` hook + `StepPlayer` control (keyboard: ←/→/Space/Home), `BarPair`/`BarStack`, `lib/graph.ts` edge geometry. Dark blue/purple design tokens. Python `scripts/` skeleton + `npm run gen`. All 10 topics greyed as coming-soon. `npm run build` verified.

- **Topic 2 — Planning, STRIPS & POP** (exam Part B). Domain: **Sussman anomaly** (blocks world, Move/MoveToTable). Correctness-first: pure engine in `src/lib/strips.ts` (grounding, forward apply, regression, relevance) + `src/lib/pop.ts` (plan, ordering/cycle logic, threat detection, promotion/demotion, linearize-then-simulate validator), covered by **Vitest** (`src/lib/planning.test.ts`, 8 tests) asserting the interleaved plan reaches the goal, both goal-first orderings dead-end, and the guided derivation is complete/valid with exactly the two `Clear(C)`/`Clear(B)` demotion threats. Four tabs (deep-linkable via `?tab=`/`?step=`): **POP Planner** (guided step-through + free play; interactive promote/demote; SVG canvas with causal links, open-precond agenda, flashing threats), **STRIPS forward** (blocks-world animation, add/delete chips, both goal-first orderings hit dead-ends), **Regression** (backward goal transform), and **Forward vs. Backward** (the "backward search can be more efficient" T/F exam item: side-by-side search fan-out, forward's goal-irrelevant actions dimmed, honest branching counts + the set-based-heuristics caveat). Registry-driven lazy chunk. Added `?tab`/`?step` deep-linking + `useStepPlayer` `initialIndex`.

- **Topic 3 — Planning in the Real World.** Tested CPM engine in `src/lib/cpm.ts` (forward ES/EF, backward LS/LF, slack, critical path, cycle detection) covered by `src/lib/cpm.test.ts` against the AIMA car-assembly values (project duration 85; critical path AddEngine2→AddWheels2→Inspect; AddEngine1/AddWheels1 slack 15). Three tabs: **Critical-path lab** (activity-node DAG with ES│EF/LS│LF, editable durations, Gantt with hatched slack, forward-then-backward step-through with the arithmetic in captions; `?step` deep-link), **HTN decomposition** (click a refinement to expand an HLA down to primitives — AIMA "Go(Home,SFO)"), and **Resources** (reusable robot vs. consumable bolts, stepped). Registry-driven lazy chunk. Exam framing kept out (matches the earlier strip).

- **Topic 4 — Quantifying Uncertainty.** Tested probability engine `src/lib/probability.ts` (enumeration/marginals/conditional prob, Bayes diagnostic, param counts) + `probability.test.ts` on the AIMA dentist joint (P(cavity|toothache)=⟨0.6,0.4⟩; Toothache⊥Catch|Cavity=0.9; base-rate posterior 8.7%). Four tabs: **Enumeration** (joint heat table, pick query + evidence → cells light up, α-normalize), **Bayes’ rule** (medical-test mass-flow with sliders + base-rate fallacy + KaTeX formula), **Parameter counts** (full joint 2ⁿ−1 vs naïve Bayes 2n+1 on a log axis), **Conditional independence** (Cavity screens off Toothache⊥Catch). All use the shared VizGuide. The enumeration & conditional-independence tabs are **example-swappable** (`?ex=`) across three classical common-cause joints — Dentistry, Flu→Fever/Cough, Spam→"free"/"prize" — each built as a naïve-Bayes product so effect₁⊥effect₂|cause holds (tested).
- **Shared: `VizGuide`** ("how to read this" panel — what / try-it / legend) now on every visualization in Topics 2–4.

- **Topic 5 — Bayesian Networks** (exam Part B). Tested engine `src/lib/bayesnet.ts` (+ test): enumeration-ask, term expansion, Markov blanket, and a general **minimal-parents structure learner** (finds the network any variable ordering induces via conditional-independence over the true distribution). Validated on the burglary net: P(B|j,m)=⟨0.284,0.716⟩, P(Alarm)=0.00252, MB(A)={B,E,J,M}, causal order = 10 params, order M,J,A,B,E = 13 params (matches AIMA). Four tabs: **Network + enumeration** (DAG, editable CPTs, term-by-term sum + α), **Markov blanket** (hover to glow), **Variable ordering** (induced structure + arc/param counts), **Variable elimination** (factor cards merge & shrink, step-through). All use VizGuide.

- **Topic 6 — Temporal Models** (umbrella world). Tested HMM engine `src/lib/hmm.ts` (+ `hmm.test.ts`, 5 tests): `predict`/`update`/`filter` (predict→update recursion), `predictAhead`, `backward`, `smooth` (forward–backward), `viterbi`. Validated on the AIMA umbrella HMM (prior ⟨0.5,0.5⟩, trans 0.7, sensor 0.9/0.2): filtering ⟨0.5⟩→0.818→0.883, prediction decays to the ⟨0.5,0.5⟩ stationary dist, and Viterbi on u=T,T gives ⟨Rain,Rain⟩. Four tabs (`?tab=`): **Filtering** (step-through predict/update per day, KaTeX with the predict-term/update-term glowing in sync, editable ☂/☀ evidence, belief bars), **Prediction** (start-belief slider → bars decay to the 0.5 stationary line), **Smoothing** (filtered vs smoothed grouped bars; honest wording — future evidence can reinforce *or* pull back an estimate; last day identical), **Viterbi** (SVG states×time trellis, best path thickened in green, back-pointer trace). All use VizGuide.

- **Topic 7 — Hidden Markov Models** (exam Part B; matrix form of the same umbrella world). Tested matrix engine `src/lib/hmmMatrix.ts` (+ `hmmMatrix.test.ts`, 9 tests) that **cross-validates against `hmm.ts`**: transition matrix T, diagonal Oₑ, forward filtering f′=α·Oₑ·Tᵀ·f, matrix backward/smoothing, max-product Viterbi, and `blowup(k)` — asserted to reproduce hmm.ts filter/smooth/viterbi to 6 dp, plus blowup(3)={states 8, cells 64, params 56}. Domain re-exports Topic 6's `UMBRELLA_HMM` so the two can't drift. Shared `Matrix`/`Vec` renderer with real square brackets. Four tabs (`?tab=`): **Matrix filtering** (T, Tᵀ, diagonal Oₑ rendered; step-through pipeline f→×Tᵀ→×Oₑ→×α with the active stage + KaTeX term lit), **Forward–backward** (forward vectors → | ← backward vectors → smoothed, in a day×row grid; boundary b_T=⟨1,1⟩), **Sum vs. max** (per-target-state product cards; toggle Σ↔max on identical products to show filtering & Viterbi are one operator apart; max highlights the winning predecessor + best path), **Mega-variable** (k-slider → 2ᵏ×2ᵏ transition grid, param counter 2ᵏ(2ᵏ−1) vs a factored model — motivates DBNs). All use VizGuide.

- **Topic 9 — NLP Foundations.** Tested NLP engine `src/lib/nlp.ts` (+ `nlp.test.ts`, 20 tests): `tokenize` (lowercase, split on non-letters, keep internal apostrophes), a documented rule-based `stem` (studies→study, running→run, happily→happi), a dictionary-form `lemmatize` (was→be, mice→mouse, running→run) with an irregulars map, and frequency / `zipfTable` / `coverage` (OOV) analysis — all asserted on small fixtures. Three tabs (`?tab=`): **Tokenization** (editable text → token chips + type/token ratio + a token·stem·lemma table that highlights rows where stem≠lemma), **Ambiguity** (expandable cards for the three types — lexical "bank", syntactic PP-attachment "with the telescope", semantic/referential "it"; whole-word span highlighting), **Zipf & OOV** (log-log rank×frequency scatter vs the ideal 1/rank line + a vocabulary-coverage curve with a slider showing coverage/OOV on the built-in corpus). All use VizGuide.

- **Topic 8 — DBN & Particle Filtering.** Tested, seedable Monte-Carlo localization engine `src/lib/particleFilter.ts` (+ `particleFilter.test.ts`, 7 tests): mulberry32 RNG, motion/sensor models, `weight` (normalize + zero-mass fallback), low-variance `systematicResample` (collapses onto the sole high-weight particle; preserves N), `histogram`/`beliefMass`/`mapEstimate`, and a seeded **end-to-end run that localizes** a robot on a 12-cell ring to within 1 cell (seed 42, 14 steps). Three tabs (`?tab=`): **Particle filter** (1-D corridor with doors, animated belief histogram + true-robot marker, Step/Play/Reset, N slider — includes a particle-deprivation demo at low N; predict→weight→resample sub-histograms per step), **DBN unrolling** (SVG 2-slice template stamped across time, inter-slice cyan / intra-slice amber arcs, isolate toggle, entanglement note on why exact inference dies), **DBN vs. HMM** (factored k-chain vs one 2ᵏ mega-node with linear-vs-exponential param counts — the Topic 7 blow-up as structure). Histogram bars use CSS transitions (framer-motion's rAF animation renders unreliably under headless virtual-time capture). All use VizGuide.

### Decisions
- **Animation engine: Framer Motion + d3 (Remotion deferred).** Interactive step-through is the exam skill (user-controlled state), which Framer Motion + d3 layout serve best; Remotion's build-time video shines for non-interactive intros and can be added per-topic later without disturbing the static build.
- **Routing: `BrowserRouter` (clean URLs).** Primary use is `npm run dev` + deploy `dist/` to a static host; SPA fallback configs shipped for Netlify/Vercel. (For sub-path hosting set `base` in `vite.config.ts`.)
- **StepPlayer state via a local `useStepPlayer` hook, not a global store (dropped the planned Zustand dep).** Lets multiple independent players coexist on one page; YAGNI on global state.
- **Fonts vendored via `@fontsource-variable/*` (Inter + JetBrains Mono).** No external font requests → stays fully static/offline.
- **Icons: local inline SVG set** (`components/Icons.tsx`) — zero icon-library weight, on-brand.
