# OpticMatch delivery checklist

## Workflow shell and mobile UX
- [x] Present a single-user, privacy-first workflow with no account requirement, no telemetry UI, and a mobile-first responsive layout.
- [x] Show the workflow stages for Gear, Reference, Variations, Refine, and Dial sheet; keep the active stage and completion state visible.
- [x] Make the core controls touch-friendly with high-contrast typography and an outdoor-readable final settings treatment.

## Gear profiles and exposure baseline
- [ ] Let the user select a camera body and lens kit, including the Sony A7 IV + FE 50mm F1.8 default kit and custom-spec framing.
- [x] Extract or represent FNumber, ExposureTime, ISOSpeedRatings, FocalLength, and WhiteBalance metadata and calculate EV100 with the specified formula.
- [x] Provide fallback lighting choices Bright sun EV 15, Overcast EV 12, Indoor bright EV 8, and Dim/night EV 4 when EXIF is unavailable.

## Three-variation editor
- [x] Let the user enter a style prompt or select quick presets.
- [x] Generate three distinct visual variation cards from a base image, preserving the branch identity and selected variation.
- [x] Allow a selected branch to be refined with a follow-up command and produce three new refined branches.
- [x] Keep the demo usable without external API credentials and document the provider abstraction for Gemini, Fal/Replicate, ComfyUI, and Ollama.

## Vision delta and dial sheet
- [ ] Compare the original and approved edit through a structured visual delta shape with bokeh, exposure shift, motion, Kelvin, tint, and lighting notes.
- [ ] Deterministically solve aperture, shutter speed, ISO, and white balance using camera/lens limits, crop factor, focal length, motion, and scene EV.
- [x] Show Mode M, aperture, shutter speed, ISO, white balance, and an actionable tip on the final dial sheet.

## Self-hosting repository
- [x] Include React + TypeScript frontend source plus FastAPI-ready backend modules, Dockerfile, Docker Compose, and `.env.example`.
- [x] Include a route manifest at `GET /manus-routes.json` and a production build command that emits `dist/index.html`.
- [x] Keep user media local to the deployment volume and avoid shipping provider secrets in client code.

## Intentionally open for the next phase

- [ ] Import the full Lensfun XML database into SQLite and make custom kit creation persist.
- [ ] Replace the local demo branches with live Gemini/Fal/Replicate/ComfyUI/Ollama adapters and connect the frontend to provider-backed media.
- [ ] Persist visual-delta analysis and session history in SQLite, including the full bokeh/motion/tint JSON contract.
