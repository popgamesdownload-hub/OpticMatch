# OpticMatch

OpticMatch is a privacy-first, open-source mobile builder for a camera exposure and look reverse-engineer. Start with a smartphone reference frame, shape three visual edit branches, then turn the approved look into a dial sheet for your camera and lens.

The current frontend preview is a portrait-first control plane inspired by mobile app builders: it has interactive provider cards, a local Ollama option, a trust center for storage and permissions, an Expo Go QR handoff, and a project screen for GitHub sync boundaries. It runs in demo mode so contributors can explore the product without an API key. The repository also includes a consent-gated local Expo bootstrap companion, the FastAPI backend starter, and a Docker Compose contract for a local deployment.

## Run the frontend

```bash
corepack enable
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Create the native Expo workspace

The browser cannot silently install Node, Expo, native SDKs, or OS permissions. Review the dry run first, then pass all three explicit consent flags when you want the local companion to create the app environment:

```bash
pnpm mobile:bootstrap
pnpm mobile:bootstrap -- --approve-install --allow-network --allow-storage
```

See [`mobile/README.md`](mobile/README.md) and [`docs/mobile-builder.md`](docs/mobile-builder.md) for the trust boundary, Ollama mode, Expo Go QR preview, and GitHub connector model.

## Self-host with Docker

```bash
cp .env.example .env
docker compose up -d --build
```

The compose stack runs the frontend at `http://localhost:3000` and the FastAPI service at `http://localhost:8000`. The API exposes `GET /health`, `POST /api/meter` for EXIF/EV extraction, and `POST /api/solve` for the deterministic camera recipe. Images remain on the host volume, and provider keys are supplied through `.env` when you add a real provider adapter.

## Product flow

1. Choose a camera body and lens kit.
2. Drop a reference photo; OpticMatch reads EXIF when available and otherwise offers EV presets.
3. Enter a style direction and generate three branches.
4. Refine a selected branch through the conversational prompt.
5. Approve the look and use the high-contrast dial sheet outdoors.

## License

MIT. See `LICENSE`.
