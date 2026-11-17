# OpticMatch implementation plan

## Scope and approach
OpticMatch is implemented as a mobile-first React + TypeScript PWA experience with a local-first interaction model. The preview build focuses on the end-to-end product loop: select a kit, upload a reference image, read or simulate EXIF metering, generate three visual branches, refine one branch, and produce a camera dial sheet through a deterministic client-side solver. The project also includes a self-hosting contract for the requested FastAPI/SQLite/Docker deployment so the repository is useful beyond the preview.

The UI is deliberately functional without a provider key: generation is represented by local demo branches, while the provider boundary and backend routes are documented for Gemini/Fal/Replicate/ComfyUI/Ollama adapters. This keeps the preview inspectable and lets a future contributor replace demo generation without restructuring the UX.

## Project structure
- `src/App.tsx` — primary state machine for the five-step workflow, demo generation, refinement, and dial-sheet calculation.
- `src/main.tsx` — React entry point.
- `src/styles.css` — visual system, responsive layout, cards, motion, and high-contrast dial-sheet treatment.
- `public/manus-routes.json` — route manifest for the Webdev preview contract.
- `backend/` — FastAPI starter modules for EXIF metering and deterministic exposure solving.
- `docker-compose.yml`, `Dockerfile`, `.env.example` — GitHub-ready self-hosting contract.
- `app.config.ts` — project-level logo metadata.

## Design direction
### Three candidate styles
- Field-notebook noir — 0.06 probability. A dark studio console with paper-like annotation surfaces and signal-green measurement accents.
- Precision daylight — 0.04 probability. An airy white instrument panel with cobalt controls and hard-edged data labels.
- Film lab dusk — 0.03 probability. A warm, grainy editorial workflow with amber highlights and a deep plum base.

### Chosen: Field-notebook noir
**Design movement:** Contemporary darkroom instrument panel: part Leica service manual, part field notebook, part quiet creative tool.

**Core principles:**
1. Make the current photographic decision obvious at a glance.
2. Pair tactile editorial surfaces with exact technical readouts.
3. Keep the core loop thumb-friendly and shallow; complexity appears only when useful.
4. Treat camera settings as the moment of payoff, not an afterthought.

**Color philosophy:** Deep ink and graphite backgrounds preserve the feeling of a darkroom. Acid mint is the signature signal color for ready/selected states. Warm paper, amber, and coral separate notes, warnings, and human guidance without turning the interface into a generic neon dashboard.

**Layout paradigm:** A left-anchored field log: compact header and progress rail establish context, while one generous working surface carries the current task. Desktop adds a slim evidence rail; mobile collapses this into an inline strip.

**Signature elements:** Slotted step markers, paper-note callouts with clipped corners, and technical readouts with a small uppercase label / large numeric value rhythm.

**Interaction philosophy:** Every action should feel like setting up a shot: choose a kit, place a frame, test a look, commit to a dial sheet. Selected states are quiet and stable; motion is reserved for generation and branch changes.

**Animation:** 180–240ms ease-out transitions; branch cards lift on selection; generating state uses a restrained scanning shimmer; dial sheet enters with a short paper-slide reveal. No looping decorative motion.

**Typography system:** System UI sans for readable controls and headings; a compact monospace stack for metadata, labels, values, and the wordmark. Headings use tight tracking and sentence case; technical values use tabular numerals.

**Brand essence:** A private visual lab that turns a desired edit into a camera recipe. Personality: exact, calm, tactile.

**Brand voice:** Headlines are direct and observant; CTAs sound like field instructions. Example lines: “Build the look before you touch the dial.” / “Keep the mood. Make it native.”

**Wordmark & logo:** A compact “OM” aperture glyph made from two offset rounded brackets, paired with a monospace wordmark. The mark appears as the small mint instrument badge in the header.

**Signature brand color:** Signal mint `#b8f0d7`.

## Build and serving
The frontend is built with Vite and serves on port 3000. The Docker image builds the frontend and serves it with the lightweight Node preview server. The `backend/` folder can be run independently with FastAPI for a real deployment; the compose file mounts `data/` for SQLite and local media. API integration points remain provider-neutral and do not ship secrets to the browser.

## Mobile-builder extension

The repository now includes a portrait-first mobile control plane that behaves like an installed app rather than a desktop dashboard. Its bottom navigation separates Build, Preview, Access, and Project. Build uses interactive provider cards for cloud BYOK and local Ollama. Access shows permission toggles and a storage budget before the user starts a runtime. Preview explains the Expo Go QR handoff, while Project makes the GitHub sync boundary and local bootstrap status visible.

Because browsers cannot install software or grant OS permissions silently, the native setup is consent-gated. `scripts/bootstrap-mobile.mjs` defaults to a dry run and requires `--approve-install --allow-network --allow-storage` before creating an Expo Router starter. Expo is the default fast-preview target; SwiftUI and Kotlin/Jetpack Compose are documented as alternative native renderers against the same local API and storage contract.
