# OpticMatch native app target

The web surface in `src/` is the open-source control plane. The native app target is an Expo Router / React Native / TypeScript project created in a user-selected local directory by `scripts/bootstrap-mobile.mjs`.

## Why the bootstrap is separate

A browser cannot silently install Node, Expo, native SDKs, or local model files on a user’s machine. The control plane therefore presents the exact setup plan first. A user explicitly approves installation, network access, and storage access before the local companion runs.

```bash
pnpm mobile:bootstrap
# review the dry run
pnpm mobile:bootstrap -- --approve-install --allow-network --allow-storage
```

The generated app uses an Expo Router starter for the fastest QR preview and can be styled with NativeWind. SwiftUI and Kotlin/Jetpack Compose are alternative renderers for contributors who want native platform projects; they consume the same local API, storage, and provider contracts. Run the Expo target locally with Metro and open the QR handoff in Expo Go:

```bash
cd data/mobile-app
pnpm start
```

## AI provider modes

The app supports a BYOK cloud adapter, a user-supplied OpenAI-compatible endpoint, or local Ollama. Keys and local endpoints stay in the user’s environment; they should never be committed to GitHub. The UI labels the Ollama mode as local and shows that model downloads are optional storage.

## GitHub and preview

The repository remains the source of truth. A future paid connector can add two-way GitHub sync; the open-source build keeps the sync boundary explicit instead of pretending a browser can write to a repository without credentials. Expo Go QR preview is session-scoped and should be generated from the active Metro session, never hard-coded into source.
