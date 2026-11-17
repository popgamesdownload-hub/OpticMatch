# OpticMatch

OpticMatch is a privacy-first, self-hosted camera exposure and look reverse-engineer. Start with a smartphone reference frame, shape three visual edit branches, then turn the approved look into a dial sheet for your camera and lens.

The current frontend preview runs fully in demo mode so contributors can explore the product without an API key. The repository also includes the requested FastAPI/SQLite-ready backend starter and a Docker Compose contract for a local deployment.

## Run the frontend

```bash
corepack enable
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

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
